extern crate itertools;
extern crate console_error_panic_hook;
use itertools::Itertools;
use wasm_bindgen::prelude::*;
use serde::{Serialize, Deserialize};
use serde_wasm_bindgen;
use std::panic;

#[wasm_bindgen]
extern "C" {
    // Use `js_namespace` here to bind `console.log(..)` instead of just
    // `log(..)`
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);

    // The `console.log` is quite polymorphic, so we can bind it with multiple
    // signatures. Note that we need to use `js_name` to ensure we always call
    // `log` in JS.
    #[wasm_bindgen(js_namespace = console, js_name = log)]
    fn log_u32(a: u32);

    // Multiple arguments too!
    #[wasm_bindgen(js_namespace = console, js_name = log)]
    fn log_many(a: &str, b: &str);
}


#[derive(Serialize, Deserialize)]
pub struct PlaidTransactionFields {
    amount: f64,
    category: Vec<String>,
}

#[derive(Serialize, Deserialize)]
pub struct SunburstNode {
    id: String,
    value: f64,
    children: Vec<SunburstNode>,
}

pub fn construct_category_sunburst_data(
    transactions: Vec<&PlaidTransactionFields>,
    current_level: usize,
    parent_name: String,
) -> SunburstNode {
    log(&parent_name);

    let categories_at_current_level = transactions.iter()
        .filter(|t| t.category.len() > current_level)
        .unique_by(|t| t.category[current_level].as_str())
        .map(|t| t.category[current_level].as_str())
        .into_iter();

    let transactions_with_exact_category_match = transactions.iter()
        .filter(|a| a.category.len() == current_level);

    return SunburstNode {
        id: parent_name,
        value: transactions_with_exact_category_match
            .map(|t| t.amount)
            .sum(),
        children: categories_at_current_level
            .map(|category| {
                let relevant_transactions = transactions
                    .iter()
                    .filter(|t| t.category.len() > current_level)
                    .filter(|c| c.category[current_level] == category)
                    .map(|t| *t)
                    .collect_vec();
                return construct_category_sunburst_data(relevant_transactions, current_level+1, category.to_string())
            })
            .collect_vec()
    };
}


#[wasm_bindgen]
pub fn add (a: i32, b: i32) -> i32 {
    log("adding!");
    return a + b;
}

#[wasm_bindgen]
pub fn get_category_sunburst_data(
    jsTransactions: JsValue
) -> Result<JsValue, JsValue> {
    panic::set_hook(Box::new(console_error_panic_hook::hook));

    log("hello!");
    let transactions: Vec<PlaidTransactionFields> = serde_wasm_bindgen::from_value(jsTransactions)?;
    log("yo!");
    let stuff = transactions.iter().map(|t| t).collect_vec();
    log("sup!");
    let something = construct_category_sunburst_data(stuff, 0, "root".to_string());
    log("wow!");
    return Ok(serde_wasm_bindgen::to_value(&something)?);
}