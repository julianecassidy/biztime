"use strict";

const express = require("express");
const db = require("../db");
const { NotFoundError, BadRequestError } = require("../expressError");
const { notify } = require("../app");

const router = new express.Router();

const MISSING_COMP = 'This company does not exist: '

/** GET /companies: get all companies in the database
 *  Return {companies: [{code, name}, ...]}
 */
router.get("/", async function (req, res) {
    const results = await db.query(
        `SELECT code, name
          FROM companies
          ORDER BY name`
    );

    const companies = results.rows;
    return res.json({ companies });
});


/** GET /companies/[code]: get the company associated with inputted code
 *  Return {company: {code, name, description, invoices: [id, ...]}}
 *  Else return 404 if company does not exist.
 */
router.get('/:code', async function (req, res) {
    const code = req.params.code;

    const cResults = await db.query(
        `SELECT code, name, description
            FROM companies
            WHERE code = $1`, 
        [code],
    );
    const company = cResults.rows[0];

    if (!company) {
        throw new NotFoundError(MISSING_COMP + code);
    }

    const iResults = await db.query(
        `SELECT id
            FROM invoices
            WHERE comp_code = $1`,
        [code],
    );
    company.invoices = iResults.rows.map(row => row.id);

    return res.json({ company });
});


/** POST /companies: adds a company to database
 * Input: JSON {code, name, description}
 * Returns new company: {company: {code, name, description}} 
 */
router.post('/', async function (req, res) {
    if (req.body === undefined) throw new BadRequestError(
        "Code, name, and description required.");

    const { code, name, description } = req.body;
    if (!code || !name || !description) {
        throw new BadRequestError("Enter a valid company code and name.")
    };

    const results = await db.query(
        `INSERT INTO companies (code, name, description)
            VALUES ($1, $2, $3)
            RETURNING code, name, description`,
        [code, name, description],
    );

    const company = results.rows[0];
    return res.status(201).json({ company });
});


/** PUT /companies/[code]: edit a company in the database
 *  Input: JSON {name, description}
 *  Returns updated company object {company: {code, name, description}} or 404 if
 *  company does not exist
 */
router.put('/:code', async function (req, res) {
    if (req.body === undefined) throw new BadRequestError();

    const code = req.params.code;
    const { name, description } = req.body;

    const results = await db.query(
        `UPDATE companies
            SET name = $1,
                description = $2
            WHERE code = $3
            RETURNING code, name, description`,
        [name, description, code],
    );
    const company = results.rows[0];

    if (!company) {
        throw new NotFoundError(MISSING_COMP + code);
    }
    return res.json({ company });
});


/** DELETE /companies/[code]: delete company from database
 *  Return {status: "deleted"} or 404 if company does not exist
*/
router.delete('/:code', async function (req, res) {
    const code = req.params.code;

    const results = await db.query(
        `DELETE FROM companies 
            WHERE code = $1
            RETURNING code`,
        [code],
    );
    const company = results.rows[0]

    if (!company) {
        throw new NotFoundError(MISSING_COMP + code);
    }
    return res.json({ status: "Deleted" });
});


module.exports = router;


