"use strict"; 

const express = require("express");
const app = require("../app");
const db = require("../db");
const { NotFoundError, BadRequestError } = require("../expressError");

const router = new express.Router();

const MISSING_INV = "That invoice is does not exist: "

/** GET /invoices: get all invoices in the database 
 *   Return {invoices: [{id, comp_code}, ...]}
*/
router.get('/', async function (req, res) {
    const results = await db.query(
        `SELECT id, comp_code
            FROM invoices`
    )
    const invoices = (results).rows;
    return res.json(invoices);
})


/** GET /invoices/[id]: get the info for a specific invoice
 *  Returns {invoice: {id, amt, paid, add_date, paid_date,
 *           company: {code, name, description}}
 *   or a 404 if invoice does not exist.
 */
router.get('/:id', async function (req, res) {
    const id = req.params.id;

    const iResults = await db.query(
        `SELECT id, amt, paid, add_date, paid_date
            FROM invoices
            WHERE id = $1`,
        [id],
    );
    const invoice = iResults.rows[0];

    if (!invoice) {
        throw new NotFoundError(MISSING_INV + id);
    }

    const cResults = await db.query(
        `SELECT c.code, c.name, c.description
            FROM companies AS c
                JOIN invoices AS i ON i.comp_code = c.code
            WHERE i.id = $1`,
        [id],
    );
    invoice.company = cResults.rows[0];
    return res.json({ invoice });
})


/** POST /invoices: adds an invoice to the database
 *  Input: JSON {comp_code, amt}
 *  Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
 */
router.post('/', async function (req, res) {
    if (req.body === undefined) throw new BadRequestError(
        "Company code and invoice amount required.");

    const { comp_code, amt } = req.body;
    if (!comp_code || !amt || isNaN(Number(amt)) || Number(amt) < 0) {
        throw new BadRequestError("Enter a valid company code and amount.")
    };

    const results = await db.query(
        `INSERT INTO invoices (comp_code, amt)
            VALUES ($1, $2)
            RETURNING comp_code, amt`,
        [comp_code, amt],
    );

    const invoice = results.rows[0];
    return res.status(201).json({ invoice });    
})


/** POST /invoices: update an invoice in the database
 *  Input: JSON {amt}
 *  Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}} or a 404
 *  if the invoice does not exist.
 */
router.put('/:id', async function (req, res) {
    if (req.body === undefined) throw new BadRequestError();

    const id = req.params.id;
    const { amt } = req.body;

    const results = await db.query(
        `UPDATE invoices
            SET amt = $1
            WHERE id = $2
            RETURNING id, comp_code, amt, paid, add_date, paid_date`,
        [amt, id],
    );
    const invoice = results.rows[0];

    if (!invoice) {
        throw new NotFoundError(MISSING_INV + id);
    }
    return res.json({ invoice });
})


/** DELETE /invoices/[id]: delete an invoice from the database
 *  Return {status: "deleted"} or 404 if invoice does not exist
 */
router.delete('/:id', async function (req, res) {
    const id = req.params.id;

    const results = await db.query(
        `DELETE FROM invoices 
            WHERE id = $1
            RETURNING id`,
        [id],
    );
    const invoice = results.rows[0]

    if (!invoice) {
        throw new NotFoundError(MISSING_INV + id);
    }
    return res.json({ status: "Deleted" });
});

module.exports = router;
