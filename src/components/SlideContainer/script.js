import { mapState, mapActions } from 'vuex';
import draggable from 'vuedraggable';
import slide from '../Slide';
import { ADD_ITEM } from '../../store';

export default {
    computed: {
        ...mapState({
            items: 'items',
            calculatedWidth: state => (state.items.length + 1) * screen.width * 0.4,
        }),
    },
    methods: {
        ...mapActions({
            addItem: ADD_ITEM,
        }),
    },
    components: {
        slide,
        draggable,
    },
};