"use strict";

const express = require("express");
const db = require("../db");
const { NotFoundError, BadRequestError } = require("../expressError");


const router = new express.Router();

/** GET /companies: get list of all companies
 *   ex. {companies: [{code, name}, ...]}
 */
router.get("/", async function (req, res) {
    const results = await db.query(
        `SELECT code, name
          FROM companies`
    );

    const companies = results.rows;
    return res.json({ companies });
});


/** GET /companies/[code]: get the company associated with inputted code
 *   ex. {company: {code, name, description}}
 *  Else return 404 if company does not exist.
 */
router.get('/:code', async function (req, res) {
    const code = req.params.code;

    const results = await db.query(
        `SELECT code, name, description
            FROM companies
            WHERE code = $1`, [code]
    );

    const company = results.rows[0];
    if (!company) {
        throw new NotFoundError("That company doesn't exist.")
    }
    return res.json({ company });
});


/** POST /companies: adds a company to database
 * Input: JSON {code, name, description}
 * Returns new company: {company: {code, name, description}} 
 */
router.post('/', async function (req, res) {
    // console.log("req.body", req.body);
    const { code, name, description } = req.body;
    
    if (!code || !name) {
        throw new BadRequestError("Enter a valid company code and name.")
    };

    const result = await db.query(
        `INSERT INTO companies (code, name, description)
            VALUES ($1, $2, $3)
            RETURNING code, name, description`,
        [code, name, description],
    );

    const company = result.rows[0];
    return res.json({ company });
});






module.exports = router;


