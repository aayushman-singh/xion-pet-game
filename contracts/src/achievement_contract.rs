use cosmwasm_std::{
    entry_point, to_json_binary, Binary, Deps, DepsMut, Env, MessageInfo, Response, StdResult, 
    Addr, Uint128, StdError, Storage, Order,
};
use cw2::set_contract_version;
use cw_storage_plus::{Item, Map};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

const CONTRACT_NAME: &str = "xion-achievement-contract";
const CONTRACT_VERSION: &str = "1.0.0";

// Storage
const CONFIG: Item<Config> = Item::new("config");
const ACHIEVEMENTS: Map<&str, Achievement> = Map::new("achievements");
const USER_ACHIEVEMENTS: Map<(&str, &str), UserAchievement> = Map::new("user_achievements");
const ZKTLS_PROOFS: Map<&str, ZkTLSProof> = Map::new("zktls_proofs");

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct Config {
    pub admin: Addr,
    pub pet_nft_contract: Option<Addr>,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct InstantiateMsg {
    pub admin: Option<String>,
    pub pet_nft_contract: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum ExecuteMsg {
    UpdateConfig {
        admin: Option<String>,
        pet_nft_contract: Option<String>,
    },
    RegisterAchievement {
        achievement: Achievement,
    },
    SubmitAchievementProof {
        achievement_id: String,
        proof: ZkTLSProof,
        supporting_data: Vec<u8>,
    },
    ValidateProof {
        proof_id: String,
    },
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum QueryMsg {
    Config {},
    Achievement { id: String },
    UserAchievement { user: String, achievement_id: String },
    UserAchievements { user: String },
    AllAchievements {},
    ProofStatus { proof_id: String },
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct Achievement {
    pub id: String,
    pub title: String,
    pub description: String,
    pub category: String,
    pub requirements: Vec<AchievementRequirement>,
    pub reward: Option<Reward>,
    pub active: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct AchievementRequirement {
    pub trigger: String,
    pub threshold: Uint128,
    pub additional_params: Option<String>, // JSON string for complex params
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct Reward {
    pub reward_type: String,
    pub value: String,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct UserAchievement {
    pub user: Addr,
    pub achievement_id: String,
    pub progress: u8, // 0-100
    pub completed: bool,
    pub completed_at: Option<u64>,
    pub proof_id: Option<String>,
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

#[entry_point]
pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    msg: InstantiateMsg,
) -> Result<Response, ContractError> {
    set_contract_version(deps.storage, CONTRACT_NAME, CONTRACT_VERSION)?;

    let admin = msg.admin
        .map(|addr| deps.api.addr_validate(&addr))
        .transpose()?
        .unwrap_or(info.sender);

    let pet_nft_contract = msg.pet_nft_contract
        .map(|addr| deps.api.addr_validate(&addr))
        .transpose()?;

    let config = Config {
        admin,
        pet_nft_contract,
    };

    CONFIG.save(deps.storage, &config)?;

    Ok(Response::new()
        .add_attribute("method", "instantiate")
        .add_attribute("admin", config.admin.to_string()))
}

#[entry_point]
pub fn execute(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> Result<Response, ContractError> {
    match msg {
        ExecuteMsg::UpdateConfig { admin, pet_nft_contract } => {
            execute_update_config(deps, info, admin, pet_nft_contract)
        }
        ExecuteMsg::RegisterAchievement { achievement } => {
            execute_register_achievement(deps, info, achievement)
        }
        ExecuteMsg::SubmitAchievementProof { achievement_id, proof, supporting_data } => {
            execute_submit_achievement_proof(deps, env, info, achievement_id, proof, supporting_data)
        }
        ExecuteMsg::ValidateProof { proof_id } => {
            execute_validate_proof(deps, info, proof_id)
        }
    }
}

fn execute_update_config(
    deps: DepsMut,
    info: MessageInfo,
    admin: Option<String>,
    pet_nft_contract: Option<String>,
) -> Result<Response, ContractError> {
    let mut config = CONFIG.load(deps.storage)?;
    
    // Only admin can update config
    if info.sender != config.admin {
        return Err(ContractError::Unauthorized {});
    }

    if let Some(admin_addr) = admin {
        config.admin = deps.api.addr_validate(&admin_addr)?;
    }

    if let Some(contract_addr) = pet_nft_contract {
        config.pet_nft_contract = Some(deps.api.addr_validate(&contract_addr)?);
    }

    CONFIG.save(deps.storage, &config)?;

    Ok(Response::new()
        .add_attribute("method", "update_config")
        .add_attribute("admin", config.admin.to_string()))
}

fn execute_register_achievement(
    deps: DepsMut,
    info: MessageInfo,
    achievement: Achievement,
) -> Result<Response, ContractError> {
    let config = CONFIG.load(deps.storage)?;
    
    // Only admin can register achievements
    if info.sender != config.admin {
        return Err(ContractError::Unauthorized {});
    }

    ACHIEVEMENTS.save(deps.storage, &achievement.id, &achievement)?;

    Ok(Response::new()
        .add_attribute("method", "register_achievement")
        .add_attribute("achievement_id", achievement.id))
}

fn execute_submit_achievement_proof(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    achievement_id: String,
    proof: ZkTLSProof,
    _supporting_data: Vec<u8>,
) -> Result<Response, ContractError> {
    let achievement = ACHIEVEMENTS.load(deps.storage, &achievement_id)?;
    
    if !achievement.active {
        return Err(ContractError::AchievementInactive {});
    }

    // Validate the zkTLS proof
    if !validate_zktls_proof(&proof)? {
        return Err(ContractError::InvalidProof {});
    }

    // Store the proof
    ZKTLS_PROOFS.save(deps.storage, &proof.id, &proof)?;

    // Check if user already has this achievement
    let user_achievement_key = (info.sender.as_str(), achievement_id.as_str());
    let mut user_achievement = USER_ACHIEVEMENTS
        .may_load(deps.storage, user_achievement_key)?
        .unwrap_or(UserAchievement {
            user: info.sender.clone(),
            achievement_id: achievement_id.clone(),
            progress: 0,
            completed: false,
            completed_at: None,
            proof_id: None,
        });

    // Process the proof and update progress
    let (progress, completed) = process_achievement_proof(&achievement, &proof)?;
    
    user_achievement.progress = progress;
    user_achievement.completed = completed;
    user_achievement.proof_id = Some(proof.id.clone());
    
    if completed && user_achievement.completed_at.is_none() {
        user_achievement.completed_at = Some(env.block.time.seconds());
    }

    USER_ACHIEVEMENTS.save(deps.storage, user_achievement_key, &user_achievement)?;

    let mut response = Response::new()
        .add_attribute("method", "submit_achievement_proof")
        .add_attribute("user", info.sender.to_string())
        .add_attribute("achievement_id", achievement_id)
        .add_attribute("progress", progress.to_string());

    if completed {
        response = response.add_attribute("completed", "true");
        
        // Add reward logic here if needed
        if let Some(reward) = &achievement.reward {
            response = response
                .add_attribute("reward_type", &reward.reward_type)
                .add_attribute("reward_value", &reward.value);
        }
    }

    Ok(response)
}

fn execute_validate_proof(
    deps: DepsMut,
    info: MessageInfo,
    proof_id: String,
) -> Result<Response, ContractError> {
    let config = CONFIG.load(deps.storage)?;
    
    // Only admin can validate proofs
    if info.sender != config.admin {
        return Err(ContractError::Unauthorized {});
    }

    let mut proof = ZKTLS_PROOFS.load(deps.storage, &proof_id)?;
    proof.verified = true;
    ZKTLS_PROOFS.save(deps.storage, &proof_id, &proof)?;

    Ok(Response::new()
        .add_attribute("method", "validate_proof")
        .add_attribute("proof_id", proof_id))
}

#[entry_point]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::Config {} => to_json_binary(&CONFIG.load(deps.storage)?),
        QueryMsg::Achievement { id } => {
            to_json_binary(&ACHIEVEMENTS.load(deps.storage, &id)?)
        }
        QueryMsg::UserAchievement { user, achievement_id } => {
            let addr = deps.api.addr_validate(&user)?;
            to_json_binary(&USER_ACHIEVEMENTS.load(deps.storage, (addr.as_str(), &achievement_id))?)
        }
        QueryMsg::UserAchievements { user } => {
            let addr = deps.api.addr_validate(&user)?;
            let achievements: StdResult<Vec<_>> = USER_ACHIEVEMENTS
                .prefix(addr.as_str())
                .range(deps.storage, None, None, Order::Ascending)
                .collect();
            to_json_binary(&achievements?)
        }
        QueryMsg::AllAchievements {} => {
            let achievements: StdResult<Vec<_>> = ACHIEVEMENTS
                .range(deps.storage, None, None, Order::Ascending)
                .collect();
            to_json_binary(&achievements?)
        }
        QueryMsg::ProofStatus { proof_id } => {
            to_json_binary(&ZKTLS_PROOFS.load(deps.storage, &proof_id)?)
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

fn process_achievement_proof(
    achievement: &Achievement,
    proof: &ZkTLSProof,
) -> Result<(u8, bool), ContractError> {
    // This is a simplified implementation
    // In practice, you would parse the proof data and validate against requirements
    
    match proof.proof_type.as_str() {
        "pet_care" | "game_session" | "pet_status" => {
            // For demo purposes, assume proof is valid and achievement is completed
            Ok((100, true))
        }
        _ => Ok((0, false))
    }
}

#[derive(thiserror::Error, Debug)]
pub enum ContractError {
    #[error("{0}")]
    Std(#[from] StdError),

    #[error("Unauthorized")]
    Unauthorized {},

    #[error("Achievement is not active")]
    AchievementInactive {},

    #[error("Invalid proof")]
    InvalidProof {},
}
