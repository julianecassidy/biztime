"use strict"; 

const express = require("express");
const db = require("../db");
const { NotFoundError } = require("../expressError");


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


/** POST /companies: adds a company to database */



module.exports = router;


