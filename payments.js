"use strict"; 

/** Payment handling functions for BizTime app */

const db = require("./db");


async function checkInvoicePaid(id) {
    console.log("checkInvoicePaid");
    const results = await db.query(
        `SELECT paid
            FROM invoices
            WHERE id = $1`,
        [id],
    );

    const invoice = results.rows[0];
    if (!invoice) {
        throw "no invoice exists";
    }

    return invoice.paid;
}

module.exports = {
    checkInvoicePaid
}