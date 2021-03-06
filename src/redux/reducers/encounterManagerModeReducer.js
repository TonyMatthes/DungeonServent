import { combineReducers } from 'redux';
import NPC from '../../gameFunctions/CharacterClasses/NPC';

const mode = (state = 'planner', action) => {
  switch (action.type) {
    case 'SET_ENCOUNTER_MODE':
      return action.payload;
    default:
      return state;
  }
};

const initialManagerState = {
  battleOrder: null,
  encounterCharacters: [],
}

const manager = (state = initialManagerState, action) => {
  const nPCRenamer = (char, renamingNumber = 2) => {
    console.log(state.battleOrder.map(item => item.individualName))
    if (!state.battleOrder.length) {
      return char
    } else if ((state.battleOrder.map(item => item.individualName)).includes(char.individualName)) {
      let newNamedCharacter = ({ ...char, individualName: char.name + ' ' + renamingNumber });
      renamingNumber++;
      return nPCRenamer(newNamedCharacter, renamingNumber)
    }
    return char
  }
  switch (action.type) {
    case 'CLEAR_BATTLE_ORDER':
      return {
        ...state,
        battleOrder: null
      }
    case 'SET_BATTLE_ORDER':
      let finalList = []
      for (let character of state.encounterCharacters) {
        let roll = character.abilityCheck('dexterity')
        character.setInitiative(roll)
        finalList.push(character)
      }
      finalList.sort((a, b) =>
        b.currentInitiative === a.currentInitiative ?
          b.abilityScores.dexterity.modifier - a.abilityScores.dexterity.modifier :
          b.currentInitiative - a.currentInitiative)

      return {
        ...state,
        battleOrder: finalList
      }
    case 'TAKE_TURN':
      const newOrder = state.battleOrder.concat((state.battleOrder.splice(0, 1)))
      return {
        ...state,
        battleOrder: newOrder
      }
    case 'ADD_PARTICIPANT':
      let newChar = action.payload.player ? action.payload : new NPC(nPCRenamer(action.payload))
      newChar.setInitiative(newChar.abilityCheck('dexterity'))
      let orderWithNewParticipant = [...state.battleOrder]
      let newCharSpliceIndex = () => {
        for (let i = 0; i < orderWithNewParticipant.length - 1; i++) {
          if (orderWithNewParticipant[i].currentInitiative < orderWithNewParticipant[i + 1].currentInitiative) {
            if (newChar.currentInitiative > orderWithNewParticipant[i + 1].currentInitiative)
              return (i + 1)
          }
          if (newChar.currentInitiative < orderWithNewParticipant[i].currentInitiative) {
            if (newChar.currentInitiative >= orderWithNewParticipant[i + 1].currentInitiative) {
              if (newChar.currentInitiative === orderWithNewParticipant[i + 1].currentInitiative) {
                if (newChar.abilityScores.dexterity.modifier >= orderWithNewParticipant[i + 1].abilityScores.dexterity.modifier) {
                  return (i + 1)
                } else {
                  return (i + 2)
                }
              }
              return (i + 1)
            }
          }
        }
        return orderWithNewParticipant.length
      }

      orderWithNewParticipant.splice(newCharSpliceIndex(), 0, newChar)

      return {
        ...state,
        battleOrder: orderWithNewParticipant
      }
    case 'SET_BATTLE_PARTICIPANTS':
      return {
        ...state,
        encounterCharacters: action.payload
      }
    case 'CLEAR_BATTLE_ORDER':
      return {
        ...state,
        battleOrder: null
      }
    case 'IS_DEAD':
      let newList = state.battleOrder.filter(character => character !== action.payload)
      return {
        ...state,
        battleOrder: newList
      }
    default:
      return state;
  }
}

export default combineReducers({
  mode,
  manager,
});