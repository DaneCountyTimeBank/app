<template>
  <f7-panel right :reveal="isiOS" :cover="isMaterial">
    <f7-navbar>
      <f7-nav-left >
        <i class="material-icons docked-icon">filter_list</i>
      </f7-nav-left>
      <f7-nav-center>
        Filters
      </f7-nav-center>
    </f7-navbar>

    <f7-page>
        <div v-for="facet in facets">
            <f7-list form>
                <f7-list-item :title="facet.name" group-title></f7-list-item>
                <f7-list-item v-for="filter in facet.filters"
                    checkbox
                    :checked="isActive(facet, filter)"
                    :value="filter | uniqueFacetValue(facet)"
                    :key="filter | uniqueFacetValue(facet)"
                    :title="filter.display"
                    @change="filtersUpdated($event.target, facet, filter)"
                >
                    {{filter.count}}
                </f7-list-item>
            </f7-list>
        </div>
    </f7-page>
  </f7-panel>
</template>

<script>
  import { remove } from "lodash";

  export default {
    name: 'RightPanel',
    data () {
      return {
        isMaterial: window.isMaterial,
        isiOS: window.isiOS,
        facets: [],
        selected: []
      };
    },

    created () {
        window.timebank_event_bus.$on('new-facet-data', (facets, current_selected) => {

            // ordering person/organization last
            var removed = remove(facets, (x) => {
                return x.name === 'Person / Organization';
            });

            this.selected = current_selected;
            this.facets = facets.concat(removed);
        });

        window.timebank_event_bus.$on('reset-facets', () => {
            this.selected = [];
            window.timebank_event_bus.$emit('facets-updated', this.selected);
        });
    },

    filters: {
        uniqueFacetValue: (filter, facet) => `${facet.id}=${filter.value}`,
    },

    methods: {

        isActive (facet, filter) {
            var active = false;
            this.selected.forEach((x) => {
                if (x.id === facet.id && x.value === filter.value) {
                    active = true;
                }
            });
            return active;
        },

        filtersUpdated (checkbox, facet, filter) {
            if (checkbox.checked) {
                this.selected.push({id: facet.id, value: filter.value});
            } else {
                remove(this.selected, (x) => {
                    return x.id === facet.id && x.value === filter.value;
                });
            }
            window.timebank_event_bus.$emit('facets-updated', this.selected);
        },

    }

  };
</script>

<style scoped>

.page {
    margin-top: 44px;
}
.list-group-title {
    height: 42px;
}
.list-block {
    margin-bottom: 0;
    margin-top: 5px;
}
.page, .page-content {
    height: auto;
}

@media (min-width: 1100px) {
    .panel.panel-right {
        border-left: 12px solid #f4f4f4;
    }
}



</style>

<style>

.panel-right .item-inner {
    font-size: 0.9em;
}

.panel-right .item-title {
    
    white-space: normal;
    padding-right: 8px;
}

.panel-right .list-block .item-media {
    min-width: 28px;
    padding: 0;
}

.panel-right .list-block .item-content, .panel-right .list-block .item-media+.item-inner {
    min-height: 36px;
}
.panel-right .list-block .item-content {
    padding-left: 8px;
}

.panel-right .list-block .item-media+.item-inner {
    margin-left: 0;
    padding-top: 0;
    padding-bottom: 0;
}

.panel-right .docked-icon {
    padding-left: 12px;
}

@media (min-width: 1100px) {
    /* hide panel-opener button when right panel is visible */
    .view-main .navbar .right .open-panel {
        display: none;
    }
}

</style>
