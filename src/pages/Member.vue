<template>
  <f7-page name="member" class="member-page">
    <f7-navbar sliding :back-link="!viewing_self && 'Back'">
      <f7-nav-left v-if="viewing_self">
        <f7-link icon="icon-bars" open-panel="left"></f7-link>
      </f7-nav-left>
      <f7-nav-center>
          {{title || user_name}}
      </f7-nav-center>
    </f7-navbar>
    
    <f7-block class="center-preloader" v-if="!loaded && !load_error">
        <f7-preloader></f7-preloader>
    </f7-block>
    <f7-block v-if="load_error">
        Error loading member - please try again later.
    </f7-block>

    <template v-if="loaded">
        <f7-block>
            <img v-if="user && user.picture_url" :src="user.picture_url" class="profile-pic" />
        </f7-block>

        <template v-if="user.location">
            <f7-block-title>Location</f7-block-title>
            <f7-block inner>
                <template v-if="user.location">
                    <template v-if="user.location.street">
                        {{user.location.street}}<br />
                    </template>
                    <template v-if="user.location.area != user.location.city">
                        {{user.location.area}}<br />
                    </template>

                    {{user.location.city}}<template v-if="user.location.postal_code"><template v-if="user.location.city">,</template> {{user.location.postal_code}}</template>
                    <br />
                </template>
            </f7-block>
        </template>

        <template v-if="user.phones">
            <f7-block-title>Phone Numbers</f7-block-title>
            <f7-block inner>
                <p>
                    <template v-if="user.phones">
                        <template v-for="phone in user.phones">
                            {{phone}}<br />
                        </template>
                    </template>
                </p>
            </f7-block>
        </template>

        <template v-if="user.description">
            <f7-block-title>About</f7-block-title>
            <f7-block inner>
                <div id="user-description" v-if="user.description" v-html="user.description"></div>
            </f7-block>
        </template>

        <template v-if="user.created">
            <f7-block-title>Joined</f7-block-title>
            <f7-block inner>
                {{user.created | timestamp_to_date}}
            </f7-block>
        </template>

        <template v-if="viewing_self">
            <f7-block-title>Balance</f7-block-title>
            <f7-block inner>
                <f7-preloader v-if="balance_loading" size="24px" color="gray"></f7-preloader>
                {{user_balance}}
            </f7-block>
        </template>

        <f7-list>
            <f7-list-item v-if="!viewing_self" :link="user | message_link" @click="setViewUserName()" title="Send Message"></f7-list-item>
            <f7-list-item :link="user | posts_link" title="Offers &amp; Requests" @click="setViewUserName()"></f7-list-item> 
            <f7-list-item v-if="viewing_self" link="/exchanges" title="Exchanges"></f7-list-item> 
        </f7-list>

        <f7-button v-if="viewing_self" :external="viewing_self" :href="user | edit_account_link">Edit Account</f7-button>
        <br />

    </template>
  </f7-page>
</template>

<script>

/*

TODO later: make look better on tablets/wider devices by using flexbox layout

TODO later: 
    
    authors profile info (eg. last login, their exchanges if those are public.. or just exchange related data)


http://timebank-testsite.org/users/bunny
http://timebank-testsite.org/users/alice-galassi
http://timebank-testsite.org/users/mike-godbe


profile shows

TODO later: graphs of hours history
            and bar graph of hours given/gotten


Offline member: 
0

user.account_offline.und[0].value == '0'  or 1?

Person or organization?: 
Person

user.field_person_or_organization_.und[0].value == '1'  for persons?

user.demog_langs_spoken.und[0].value == 'english'

user.login = "1487805566"

*/

    import Timebank from '../timebank';

    export default {
        props: ['user_id'],
        name: 'Member',
        data () {

            var viewing_self = false,
                title = '',
                load_user_id = this.user_id;

            if (load_user_id === 'me') {
                load_user_id = localStorage.user_id;
            }

            if (load_user_id === localStorage.user_id) {
                title = 'Your Account';
                viewing_self = true;
            }

            return {
                user: {},
                load_user_id: load_user_id,
                title: title,
                viewing_self: viewing_self,
                user_name: this.$root.view_user_name || ('Member ' + load_user_id),
                user_balance: '',
                balance_loading: true,
                loaded: false,
                load_error: false,
            };
        },
        filters: {
            size_picture_to_fit (user, w, h) {
                
                console.log('size user', user);

                var x = user.picture_width,
                    y = user.picture_height;

                if (x > w) {
                    y = Math.max(y * w / x, 1);
                    x = w;
                }
                if (y > h) {
                    x = Math.max(x * h / y, 1);
                    y = h;
                }

                var out = {maxWidth: x + 'px', maxHeight: y + 'px'};

                console.log('returning size', out);

                return out;
            },
            posts_link: user => `/posts?user_id=${user.user_id}`,
            message_link: user => `/member/${user.user_id}/message`,
            edit_account_link: user => `https://danecountytimebank.org/user/${user.user_id}/account/profile`,
        },
        methods: {
            setViewUserName () {
                this.$root.view_user_name = this.user_name;
            },
        },
        created () {

            Timebank.get_user(
                this.load_user_id,
                user => {
                    this.user_name = user.name;
                    this.user = user;
                    this.loaded = true;
                },
                (status, msg) => {
                    this.load_error = true;
                }
            );

            if (this.viewing_self) {
                Timebank.get_transactions(
                    {start: 0, num: 0},
                    data => {
                        this.balance_loading = false;
                        this.user_balance = Timebank.hours_to_hour_minute_display(data.balance);
                    }, 
                    (status, msg) => {
                        this.balance_loading = false;
                        this.user_balance = 'Error loading balance.';
                    }
                );
            }

        }
    };

</script>

<style>

.member-page .content-block-title {
    margin-top: 0;
    padding-top: 0;
}
.member-page .content-block {
    margin-bottom: 22px;
}

.profile-pic {
    width: 100%;
    max-width: 280px;
    margin-top: -32px;
    margin-bottom: -10px;
}

.member-page .page-content {
    margin-bottom: 60px;
}

</style>

