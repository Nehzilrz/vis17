import Vue from 'vue';
import Vuex from 'vuex';
import state from './state';
import mutations from './mutations';
import actions from './actions';
import getters from './getters';

Vue.use(Vuex);
export default new Vuex.Store({
    state,
    mutations,
    actions,
    getters,
});

export {
    ADD_CHANNEL,
    REMOVE_CHANNEL,
    SELECT_CHANNEL,
    UPDATE_BLOCKS,
    SELECT_BLOCK,
    SELECT_ELE,
    EDIT_SELECTED_ELE,
} from './types';
