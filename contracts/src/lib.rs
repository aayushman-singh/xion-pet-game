// User Map Contract - simple key-value storage
use cosmwasm_std::{
    entry_point, to_json_binary, Binary, Deps, DepsMut, Env, MessageInfo, Response, StdResult,
    StdError,
};
use cw2::set_contract_version;
use cw_storage_plus::Map;
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

const CONTRACT_NAME: &str = "xion-user-map";
const CONTRACT_VERSION: &str = "1.0.0";

// Storage - maps user addresses to their JSON data
const USER_DATA: Map<&str, String> = Map::new("user_data");

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct InstantiateMsg {}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum ExecuteMsg {
    SetValue {
        key: String,
        value: String,
    },
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum QueryMsg {
    GetValue { key: String },
    GetValueByUser { address: String },
}

#[entry_point]
pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    _info: MessageInfo,
    _msg: InstantiateMsg,
) -> Result<Response, ContractError> {
    set_contract_version(deps.storage, CONTRACT_NAME, CONTRACT_VERSION)?;
    Ok(Response::new())
}

#[entry_point]
pub fn execute(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> Result<Response, ContractError> {
    match msg {
        ExecuteMsg::SetValue { key, value } => {
            let storage_key = if key.is_empty() {
                info.sender.to_string()
            } else {
                key
            };
            USER_DATA.save(deps.storage, &storage_key, &value)?;
            Ok(Response::new())
        }
    }
}

#[entry_point]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::GetValue { key } => {
            let value = USER_DATA.may_load(deps.storage, &key)?;
            to_json_binary(&value)
        }
        QueryMsg::GetValueByUser { address } => {
            let addr = deps.api.addr_validate(&address)?;
            let value = USER_DATA.may_load(deps.storage, addr.as_str())?;
            match value {
                Some(v) => to_json_binary(&v),
                None => Err(StdError::generic_err("No value found for user")),
            }
        }
    }
}

#[derive(thiserror::Error, Debug)]
pub enum ContractError {
    #[error("{0}")]
    Std(#[from] StdError),
}