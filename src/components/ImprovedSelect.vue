<template>
    <select v-model="internal_value" multiple="multiple"> 
      <option v-for="opt in options" :value="opt.value || opt.id">{{opt.name || opt.title}}</option>
    </select>
</template>

<script>

  export default {
    name: 'ImprovedSelect',
    data () {
        return {
            internal_value: this.value.slice(), // copy to prevent mutating the parent value
            value_updated: false,
        };
    },

    props: {
        value: {
            type: Array,
            required: false,
            default: function(){ return []; }
        },
        options: {
            type: Array,
            required: true
        }
        // XXX: support name attribute?
        //      support multiple or single select?
        //      how to set pre-selected value if single vs multiple select
    },

    watch: {
        // XXX: may be a more 'vue' way of doing this by using :value="value" @change="updateValue($event.target)" on the <select> tag instead of v-model

        value: function(updated_value) {
            // value was changed by parent, the select options update automatically 
            // but we need to update the smart-select display text b/c it won't update automatically

            this.value_updated = true; // prevent emitting a change event which will cause an infinite loop
            this.internal_value = updated_value.slice(); // copy to prevent mutating the parent value
            this.updateDisplay(updated_value);
        },

        internal_value: function(updated_value) {
            if (this.value_updated) {
                this.value_updated = false;
            } else {
                this.$emit('input', updated_value);
            }
        }
    },

    methods: {

        getOptionValue2NameMap () {
            var map = {};
            [...this.$el.options].forEach(function(opt){
                map[opt.value] = opt.innerText;
            });
            return map;
        },

        updateDisplay (new_values) {

            // assumes that this component is wrapped by a f7-list-item smart-select ..
            // may not be a safe assumption so may want to collapse that into this to make it easier..
            // but then would have to support & pass on all smart-select props ..
            // so for now just doing the easier way and doing checks below

            var el = this.$el.nextSibling;

            if (el && el.className && el.className.indexOf('item-after') >= 0) {

                var map = this.getOptionValue2NameMap(),
                    new_names = new_values.map(v => map['' + v]).join(', ');

                el.innerText = new_names;
            }
        },

        /*
        getSelectedOptions () {
            return [...this.$el.options].filter(opt => opt.selected);
        },

        getSelectionValues () {
            return this.getSelectedOptions().map(opt => opt.value);
        },

        getSelectionNames () {
            return this.getSelectedOptions().map(opt => opt.innerText);
        },
        */

    }

  };
</script>

<style scoped>
    
</style>
