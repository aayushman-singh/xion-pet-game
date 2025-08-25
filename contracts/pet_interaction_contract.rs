use cosmwasm_std::{
    entry_point, to_binary, Binary, Deps, DepsMut, Env, MessageInfo, Response, StdResult,
    Addr, Uint128, StdError, Storage, Order, Timestamp,
};
use cw2::set_contract_version;
use cw_storage_plus::{Item, Map};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

const CONTRACT_NAME: &str = "xion-pet-interaction";
const CONTRACT_VERSION: &str = "1.0.0";

// Storage
const CONFIG: Item<Config> = Item::new("config");
const PET_STATUS: Map<&str, PetStatus> = Map::new("pet_status");
const GAME_SESSIONS: Map<&str, GameSession> = Map::new("game_sessions");
const PET_CARE_HISTORY: Map<(&str, u64), PetCareActivity> = Map::new("pet_care_history");
const ZKTLS_PROOFS: Map<&str, ZkTLSProof> = Map::new("zktls_proofs");

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct Config {
    pub admin: Addr,
    pub achievement_contract: Option<Addr>,
    pub pet_nft_contract: Option<Addr>,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct InstantiateMsg {
    pub admin: Option<String>,
    pub achievement_contract: Option<String>,
    pub pet_nft_contract: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum ExecuteMsg {
    UpdateConfig {
        admin: Option<String>,
        achievement_contract: Option<String>,
        pet_nft_contract: Option<String>,
    },
    UpdatePetStatus {
        pet_id: String,
        status: PetStatus,
        proof: ZkTLSProof,
    },
    RecordCareActivity {
        pet_id: String,
        activity: PetCareActivity,
        proof: ZkTLSProof,
    },
    RecordGameSession {
        session: GameSession,
        proof: ZkTLSProof,
    },
    ProcessStatusDegradation {
        pet_id: String,
        old_status: PetStatus,
        new_status: PetStatus,
        proof: ZkTLSProof,
    },
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum QueryMsg {
    Config {},
    PetStatus { pet_id: String },
    GameSession { session_id: String },
    PetCareHistory { pet_id: String, limit: Option<u32> },
    UserGameSessions { user: String, limit: Option<u32> },
    ProofStatus { proof_id: String },
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct PetStatus {
    pub pet_id: String,
    pub owner: Addr,
    pub happiness: u8,     // 0-100
    pub hunger: u8,        // 0-100
    pub energy: u8,        // 0-100
    pub cleanliness: u8,   // 0-100
    pub last_updated: u64,
    pub care_streak: u32,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct PetCareActivity {
    pub pet_id: String,
    pub owner: Addr,
    pub activity_type: String, // "feed", "play", "clean", "rest"
    pub timestamp: u64,
    pub impact: ActivityImpact,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct ActivityImpact {
    pub happiness_change: i8,
    pub hunger_change: i8,
    pub energy_change: i8,
    pub cleanliness_change: i8,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct GameSession {
    pub session_id: String,
    pub player: Addr,
    pub pet_ids: Vec<String>,
    pub start_time: u64,
    pub end_time: Option<u64>,
    pub max_height: Uint128,
    pub final_score: Uint128,
    pub pet_swaps: Vec<PetSwap>,
    pub completed: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct PetSwap {
    pub from_pet: Option<String>,
    pub to_pet: String,
    pub height: Uint128,
    pub timestamp: u64,
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

    let achievement_contract = msg.achievement_contract
        .map(|addr| deps.api.addr_validate(&addr))
        .transpose()?;

    let pet_nft_contract = msg.pet_nft_contract
        .map(|addr| deps.api.addr_validate(&addr))
        .transpose()?;

    let config = Config {
        admin,
        achievement_contract,
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
        ExecuteMsg::UpdateConfig { admin, achievement_contract, pet_nft_contract } => {
            execute_update_config(deps, info, admin, achievement_contract, pet_nft_contract)
        }
        ExecuteMsg::UpdatePetStatus { pet_id, status, proof } => {
            execute_update_pet_status(deps, env, info, pet_id, status, proof)
        }
        ExecuteMsg::RecordCareActivity { pet_id, activity, proof } => {
            execute_record_care_activity(deps, env, info, pet_id, activity, proof)
        }
        ExecuteMsg::RecordGameSession { session, proof } => {
            execute_record_game_session(deps, env, info, session, proof)
        }
        ExecuteMsg::ProcessStatusDegradation { pet_id, old_status, new_status, proof } => {
            execute_process_status_degradation(deps, env, info, pet_id, old_status, new_status, proof)
        }
    }
}

fn execute_update_config(
    deps: DepsMut,
    info: MessageInfo,
    admin: Option<String>,
    achievement_contract: Option<String>,
    pet_nft_contract: Option<String>,
) -> Result<Response, ContractError> {
    let mut config = CONFIG.load(deps.storage)?;
    
    if info.sender != config.admin {
        return Err(ContractError::Unauthorized {});
    }

    if let Some(admin_addr) = admin {
        config.admin = deps.api.addr_validate(&admin_addr)?;
    }

    if let Some(contract_addr) = achievement_contract {
        config.achievement_contract = Some(deps.api.addr_validate(&contract_addr)?);
    }

    if let Some(contract_addr) = pet_nft_contract {
        config.pet_nft_contract = Some(deps.api.addr_validate(&contract_addr)?);
    }

    CONFIG.save(deps.storage, &config)?;

    Ok(Response::new().add_attribute("method", "update_config"))
}

fn execute_update_pet_status(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    pet_id: String,
    mut status: PetStatus,
    proof: ZkTLSProof,
) -> Result<Response, ContractError> {
    // Validate proof
    if !validate_zktls_proof(&proof)? {
        return Err(ContractError::InvalidProof {});
    }

    // Verify ownership (check against pet NFT contract if configured)
    let config = CONFIG.load(deps.storage)?;
    if let Some(_pet_contract) = config.pet_nft_contract {
        // In a real implementation, query the NFT contract to verify ownership
        // For now, we'll trust the status.owner field
    }

    // Update timestamp and save
    status.last_updated = env.block.time.seconds();
    status.owner = info.sender.clone();
    
    PET_STATUS.save(deps.storage, &pet_id, &status)?;
    ZKTLS_PROOFS.save(deps.storage, &proof.id, &proof)?;

    Ok(Response::new()
        .add_attribute("method", "update_pet_status")
        .add_attribute("pet_id", pet_id)
        .add_attribute("owner", info.sender.to_string())
        .add_attribute("happiness", status.happiness.to_string()))
}

fn execute_record_care_activity(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    pet_id: String,
    mut activity: PetCareActivity,
    proof: ZkTLSProof,
) -> Result<Response, ContractError> {
    // Validate proof
    if !validate_zktls_proof(&proof)? {
        return Err(ContractError::InvalidProof {});
    }

    // Set activity owner and timestamp
    activity.owner = info.sender.clone();
    activity.timestamp = env.block.time.seconds();

    // Update pet status if it exists
    if let Ok(mut pet_status) = PET_STATUS.load(deps.storage, &pet_id) {
        if pet_status.owner == info.sender {
            // Apply activity impact
            pet_status.happiness = apply_change(pet_status.happiness, activity.impact.happiness_change);
            pet_status.hunger = apply_change(pet_status.hunger, activity.impact.hunger_change);
            pet_status.energy = apply_change(pet_status.energy, activity.impact.energy_change);
            pet_status.cleanliness = apply_change(pet_status.cleanliness, activity.impact.cleanliness_change);
            pet_status.last_updated = env.block.time.seconds();
            
            // Update care streak
            pet_status.care_streak += 1;
            
            PET_STATUS.save(deps.storage, &pet_id, &pet_status)?;
        }
    }

    // Store activity
    PET_CARE_HISTORY.save(deps.storage, (&pet_id, activity.timestamp), &activity)?;
    ZKTLS_PROOFS.save(deps.storage, &proof.id, &proof)?;

    Ok(Response::new()
        .add_attribute("method", "record_care_activity")
        .add_attribute("pet_id", pet_id)
        .add_attribute("activity_type", activity.activity_type)
        .add_attribute("owner", info.sender.to_string()))
}

fn execute_record_game_session(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    mut session: GameSession,
    proof: ZkTLSProof,
) -> Result<Response, ContractError> {
    // Validate proof
    if !validate_zktls_proof(&proof)? {
        return Err(ContractError::InvalidProof {});
    }

    // Set session player
    session.player = info.sender.clone();
    
    // If end_time is not set and session is completed, set it now
    if session.completed && session.end_time.is_none() {
        session.end_time = Some(env.block.time.seconds());
    }

    GAME_SESSIONS.save(deps.storage, &session.session_id, &session)?;
    ZKTLS_PROOFS.save(deps.storage, &proof.id, &proof)?;

    Ok(Response::new()
        .add_attribute("method", "record_game_session")
        .add_attribute("session_id", session.session_id)
        .add_attribute("player", info.sender.to_string())
        .add_attribute("final_score", session.final_score.to_string()))
}

fn execute_process_status_degradation(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    pet_id: String,
    _old_status: PetStatus,
    new_status: PetStatus,
    proof: ZkTLSProof,
) -> Result<Response, ContractError> {
    // Validate proof
    if !validate_zktls_proof(&proof)? {
        return Err(ContractError::InvalidProof {});
    }

    // Verify the caller owns the pet
    if let Ok(current_status) = PET_STATUS.load(deps.storage, &pet_id) {
        if current_status.owner != info.sender {
            return Err(ContractError::Unauthorized {});
        }
    }

    // Update pet status with degraded values
    PET_STATUS.save(deps.storage, &pet_id, &new_status)?;
    ZKTLS_PROOFS.save(deps.storage, &proof.id, &proof)?;

    Ok(Response::new()
        .add_attribute("method", "process_status_degradation")
        .add_attribute("pet_id", pet_id)
        .add_attribute("new_happiness", new_status.happiness.to_string()))
}

#[entry_point]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::Config {} => to_binary(&CONFIG.load(deps.storage)?),
        QueryMsg::PetStatus { pet_id } => {
            to_binary(&PET_STATUS.load(deps.storage, &pet_id)?)
        }
        QueryMsg::GameSession { session_id } => {
            to_binary(&GAME_SESSIONS.load(deps.storage, &session_id)?)
        }
        QueryMsg::PetCareHistory { pet_id, limit } => {
            let limit = limit.unwrap_or(50) as usize;
            let history: StdResult<Vec<_>> = PET_CARE_HISTORY
                .prefix(&pet_id)
                .range(deps.storage, None, None, Order::Descending)
                .take(limit)
                .collect();
            to_binary(&history?)
        }
        QueryMsg::UserGameSessions { user, limit } => {
            let addr = deps.api.addr_validate(&user)?;
            let limit = limit.unwrap_or(50) as usize;
            let sessions: StdResult<Vec<_>> = GAME_SESSIONS
                .range(deps.storage, None, None, Order::Descending)
                .filter(|item| {
                    if let Ok((_, session)) = item {
                        session.player == addr
                    } else {
                        false
                    }
                })
                .take(limit)
                .collect();
            to_binary(&sessions?)
        }
        QueryMsg::ProofStatus { proof_id } => {
            to_binary(&ZKTLS_PROOFS.load(deps.storage, &proof_id)?)
        }
    }
}

// Helper functions
fn validate_zktls_proof(proof: &ZkTLSProof) -> Result<bool, ContractError> {
    if proof.signature.is_empty() || proof.data_hash.is_empty() {
        return Ok(false);
    }
    
    let current_time = cosmwasm_std::Timestamp::default().seconds();
    if proof.timestamp > current_time + 300 {
        return Ok(false);
    }
    
    Ok(true)
}

fn apply_change(current: u8, change: i8) -> u8 {
    let new_value = current as i16 + change as i16;
    if new_value < 0 {
        0
    } else if new_value > 100 {
        100
    } else {
        new_value as u8
    }
}

#[derive(thiserror::Error, Debug)]
pub enum ContractError {
    #[error("{0}")]
    Std(#[from] StdError),

    #[error("Unauthorized")]
    Unauthorized {},

    #[error("Invalid proof")]
    InvalidProof {},
}
