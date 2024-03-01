extern crate itertools;
use itertools::Itertools;
use wasm_bindgen::prelude::*;
use serde::{Serialize, Deserialize};
use serde_wasm_bindgen;
use std::{panic, vec};

#[wasm_bindgen(typescript_custom_section)]
const TS_APPEND_CONTENT: &'static str = r#"
  export type SunburstNode = {
    id: string,
    value: number,
    children: SunburstNode[],
    full_path: string[]
  }
  export type PlaidTransactionFields = {
    amount: number,
    category: string[],
  }

  export function get_category_sunburst_data(
    js_transactions: PlaidTransactionFields
  ): SunburstNode
"#;

#[wasm_bindgen]
pub fn get_category_sunburst_data(
    js_transactions: JsValue
) -> Result<JsValue, JsValue> {
    panic::set_hook(Box::new(console_error_panic_hook::hook));

    let transactions: Vec<PlaidTransactionFields> = serde_wasm_bindgen::from_value(js_transactions)?;
    let stuff = transactions.iter().collect_vec();
    let something = construct_category_sunburst_data(stuff, 0, "root", vec![]);
    return Ok(serde_wasm_bindgen::to_value(&something)?);
}

#[derive(Deserialize)]
pub struct PlaidTransactionFields {
    amount: f64,
    category: Vec<String>,
}

#[derive(Serialize)]
pub struct SunburstNode<'a> {
    id: &'a str,
    value: f64,
    children: Vec<SunburstNode<'a>>,
    full_path: Vec<&'a str>
}

fn concat_string<'a>(first: &[&'a str], second: &[&'a str]) -> Vec<&'a str> {
    [first, second].concat()
}

pub fn construct_category_sunburst_data<'a>(
    transactions: Vec<&'a PlaidTransactionFields>,
    current_level: usize,
    parent_name: &'a str,
    parent_path: Vec<&'a str>,
) -> SunburstNode<'a> {

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
        full_path: parent_path.clone(),
        children: categories_at_current_level
            .map(|category| {
                return construct_category_sunburst_data(
                    transactions
                        .iter()
                        .filter(|t| t.category.len() > current_level)
                        .filter(|c| c.category[current_level] == category)
                        .map(|t| *t)
                        .collect_vec(), 
                    current_level+1, 
                    category, 
                    concat_string(&parent_path, &[category])
                )
            })
            .collect_vec()
    };
}
