use cosmwasm_std::{
    entry_point, to_binary, Binary, Deps, DepsMut, Env, MessageInfo, Response, StdResult, Uint128,
    Addr, CosmosMsg, WasmMsg, SubMsg,
};
use cw2::set_contract_version;
use cw721::{ContractError, Cw721, Cw721Execute, Cw721Query, Expiration, OwnerOfResponse};
use cw721_base::{
    state::Cw721Contract,
    ContractError as Cw721BaseError,
    InstantiateMsg as Cw721InstantiateMsg,
    QueryMsg as Cw721QueryMsg,
    ExecuteMsg as Cw721ExecuteMsg,
};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

const CONTRACT_NAME: &str = "xion-pet-nft";
const CONTRACT_VERSION: &str = "1.0.0";

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct InstantiateMsg {
    pub name: String,
    pub symbol: String,
    pub minter: String,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum ExecuteMsg {
    Mint {
        token_id: String,
        owner: String,
        token_uri: Option<String>,
        extension: Option<Metadata>,
    },
    TransferNft {
        recipient: String,
        token_id: String,
    },
    Burn {
        token_id: String,
    },
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum QueryMsg {
    OwnerOf { token_id: String, include_expired: Option<bool> },
    NumTokens {},
    ContractInfo {},
    AllTokens { start_after: Option<String>, limit: Option<u32> },
    Tokens { owner: String, start_after: Option<String>, limit: Option<u32> },
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct Metadata {
    pub name: String,
    pub description: String,
    pub image: String,
    pub attributes: Vec<Attribute>,
    pub zktls_proof: Option<ZkTLSProof>,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct ZkTLSProof {
    pub id: String,
    pub proof_type: String,
    pub signature: String,
    pub timestamp: u64,
    pub data_hash: String,
    pub verified: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct Attribute {
    pub trait_type: String,
    pub value: String,
}

#[entry_point]
pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    msg: InstantiateMsg,
) -> Result<Response, ContractError> {
    set_contract_version(deps.storage, CONTRACT_NAME, CONTRACT_VERSION)?;

    let instantiate_msg = Cw721InstantiateMsg {
        name: msg.name,
        symbol: msg.symbol,
        minter: msg.minter,
    };

    let cw721_contract = Cw721Contract::default();
    cw721_contract.instantiate(deps, _env, info, instantiate_msg)?;

    Ok(Response::new()
        .add_attribute("method", "instantiate")
        .add_attribute("name", msg.name)
        .add_attribute("symbol", msg.symbol))
}

#[entry_point]
pub fn execute(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> Result<Response, ContractError> {
    let cw721_contract = Cw721Contract::default();

    match msg {
        ExecuteMsg::Mint { token_id, owner, token_uri, extension } => {
            let owner_addr = deps.api.addr_validate(&owner)?;
            
            // Validate zkTLS proof if provided in metadata
            if let Some(ref metadata) = extension {
                if let Some(ref proof) = metadata.zktls_proof {
                    if !validate_zktls_proof(proof)? {
                        return Err(ContractError::InvalidProof {});
                    }
                }
            }
            
            let mint_msg = cw721_base::ExecuteMsg::Mint {
                token_id: token_id.clone(),
                owner: owner_addr.to_string(),
                token_uri,
                extension,
            };

            cw721_contract.execute(deps, env, info, mint_msg)?;

            Ok(Response::new()
                .add_attribute("method", "mint")
                .add_attribute("token_id", token_id)
                .add_attribute("owner", owner))
        }
        ExecuteMsg::TransferNft { recipient, token_id } => {
            let recipient_addr = deps.api.addr_validate(&recipient)?;
            
            let transfer_msg = cw721_base::ExecuteMsg::TransferNft {
                recipient: recipient_addr.to_string(),
                token_id: token_id.clone(),
            };

            cw721_contract.execute(deps, env, info, transfer_msg)?;

            Ok(Response::new()
                .add_attribute("method", "transfer_nft")
                .add_attribute("token_id", token_id)
                .add_attribute("recipient", recipient))
        }
        ExecuteMsg::Burn { token_id } => {
            let burn_msg = cw721_base::ExecuteMsg::Burn {
                token_id: token_id.clone(),
            };

            cw721_contract.execute(deps, env, info, burn_msg)?;

            Ok(Response::new()
                .add_attribute("method", "burn")
                .add_attribute("token_id", token_id))
        }
    }
}

#[entry_point]
pub fn query(deps: Deps, env: Env, msg: QueryMsg) -> StdResult<Binary> {
    let cw721_contract = Cw721Contract::default();

    match msg {
        QueryMsg::OwnerOf { token_id, include_expired } => {
            let query_msg = Cw721QueryMsg::OwnerOf { token_id, include_expired };
            to_binary(&cw721_contract.query(deps, env, query_msg)?)
        }
        QueryMsg::NumTokens {} => {
            let query_msg = Cw721QueryMsg::NumTokens {};
            to_binary(&cw721_contract.query(deps, env, query_msg)?)
        }
        QueryMsg::ContractInfo {} => {
            let query_msg = Cw721QueryMsg::ContractInfo {};
            to_binary(&cw721_contract.query(deps, env, query_msg)?)
        }
        QueryMsg::AllTokens { start_after, limit } => {
            let query_msg = Cw721QueryMsg::AllTokens { start_after, limit };
            to_binary(&cw721_contract.query(deps, env, query_msg)?)
        }
        QueryMsg::Tokens { owner, start_after, limit } => {
            let query_msg = Cw721QueryMsg::Tokens { owner, start_after, limit };
            to_binary(&cw721_contract.query(deps, env, query_msg)?)
        }
    }
}

// Helper functions
fn validate_zktls_proof(proof: &ZkTLSProof) -> Result<bool, ContractError> {
    // Basic validation - in a real implementation, this would verify the cryptographic proof
    if proof.signature.is_empty() || proof.data_hash.is_empty() {
        return Ok(false);
    }
    
    // Timestamp should be within reasonable bounds (not too old, not in future)
    let current_time = cosmwasm_std::Timestamp::default().seconds();
    if proof.timestamp > current_time + 300 { // 5 minutes future tolerance
        return Ok(false);
    }
    
    Ok(true)
}

#[derive(thiserror::Error, Debug)]
pub enum ContractError {
    #[error("{0}")]
    Std(#[from] cosmwasm_std::StdError),

    #[error("{0}")]
    Base(#[from] cw721_base::ContractError),

    #[error("Invalid zkTLS proof")]
    InvalidProof {},
}
