<template>
    <f7-datepicker v-model="internal_value" :close-on-select="is_ios" :max-date="maxDate" :min-date="minDate" @close="onClose" class="improved-datepicker"></f7-datepicker>
</template>

<script>

  export default {
    name: 'ImprovedDatepicker',
    data () {
        return {
            internal_value: this.convertValue(this.value), // f7-datepicker expects a string, array or number
            is_ios: window.isiOS,
        };
    },

    props: {
        value: {
            type: Date,
            required: false,
            default: null,
        },
        maxDate: {
            type: Date,
            required: false,
            default: null
        },
        minDate: {
            type: Date,
            required: false,
            default: null
        }
    },

    watch: {
        value: function(updated_value) {
            this.internal_value = this.convertValue(updated_value);
        },

    },

    methods: {

        convertValue (dt) {
            // the datepicker expects a String, Array or Number
            // improved-datepicker just assumes null or a Date object is passed
            // so we convert valid Dates to [Date] which datepicker can handle
            //
            // (this has the benefit of skipping handling strings which appear to be parsed incorrectly by the calendar sometimes..)

            if (!dt) return dt;            
            return [new Date(dt.getTime())]; // make a copy, return as array
        },

        // see: https://github.com/framework7io/Framework7-Vue/blob/master/src/components/datepicker.vue
        //      https://github.com/framework7io/Framework7-Vue/blob/master/src/mixins/calendar-date-picker.vue

        onClose (calendar) {
            // using a close handler to just trigger one input change 
            // instead of triggering many input events via a change handler
            this.$emit('input', calendar.value[0]);
        }
    }

  };
</script>

<style scoped>
    
</style>
