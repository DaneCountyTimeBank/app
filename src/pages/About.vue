<template>
  <f7-page name="about">
    <f7-navbar sliding>
      <f7-nav-left>
        <f7-link icon="icon-bars" open-panel="left"></f7-link>
      </f7-nav-left>
      <f7-nav-center>
        About
      </f7-nav-center>
    </f7-navbar>
    <!-- Scrollable page content-->
    <f7-block-title>{{ title }}</f7-block-title>
    <f7-block inner>
        TimeBank members are a caring and interconnected community of people who help each other by sharing their abilities, talents, and experiences.
        <br /><br />
        As a TimeBank member, you can provide services for other members and you will earn one TimeBank Hour for each hour you spend providing the service – everyone’s time and talents are valued equally. 
        <br /><br />
        You can then exchange each TimeBank Hour you've earned for an hour of service from another TimeBank member.
    </f7-block>
    <f7-block-title>Contacts</f7-block-title>
    <f7-block inner class="staff-details">
        For general information, please <f7-link external href="mailto:info@danecountytimebank.org">email our staff</f7-link> or call our office number at <f7-link external href="tel:6086630400">(608) 663-0400</f7-link>.
        <br /><br />
        To contact staff with more urgent needs, please use the contact details listed below.
        <br /><br />

        <template v-for="role in staff">
            <strong>{{role.title}}</strong><br />
            <template v-for="person in role.people">
                {{person.name}}
                &nbsp; <f7-link v-if="person.email" external :href="'mailto:' + person.email"><i class="material-icons">email</i></f7-link>
                <template v-if="person.phone">
                    <br /><f7-link external :href="'tel:' + person.phone">{{person.phone_display}}</f7-link>
                </template>
                <br />
            </template>
            <br />
        </template>

    </f7-block>
    <f7-block-title>Address</f7-block-title>
    <f7-block inner>
        Dane County TimeBank<br />
        1202 Williamson St. Suite 107<br />
        Madison, WI 53703<br />
        <f7-link external href="tel:6086630400">(608) 663-0400</f7-link>
    </f7-block>

    <!--

        TODO later: add projects - https://danecountytimebank.org/projects
        TODO even later: board of directors maybe

        TODO later: make a faq page just for the app based on questions received about the app..
                    pull from desktop site faq some things (eg. liability/safeting/screening info)

    -->

    </f7-block>
  </f7-page>
</template>

<script>
  export default {
    name: 'About',
    data () {
      return {
        title: 'Dane County TimeBank',
        staff: [
            // <i class="material-icons color-darkgreen">email</i> &nbsp; <i class="material-icons color-darkgreen">phone</i>
            {
                title: 'Executive Director',
                people: [
                    {name: 'Lorrie Hurckes Dwyer', email: 'lorrie@danecountytimebank.org'}
                ]
            },
            {
                title: 'Community Outreach Coordinator',
                people: [
                    {name: 'Gary Messinger', email: 'gary@danecountytimebank.org', phone: '6086307742', phone_display: '(608) 630-7742'}
                ]
            },
            {
                title: 'Sun Prairie Neighborhood Coordinator',
                people: [
                    {name: 'Amy Anderson', email: 'amy@danecountytimebank.org'}
                ]
            },
            {
                title: 'Youth Court Coordinators',
                people: [
                    {name: 'Brittany McKennie', email: 'brittany@danecountytimebank.org'},
                    {name: 'Tierra Merritt', email: 'tierra@danecountytimebank.org'},
                    {name: 'Alexis Gardner', email: 'alexis@danecountytimebank.org'},
                ]
            },
            {
                title: 'Transportation Coordinator',
                people: [
                    {name: 'Bunny Brzezinski', email: 'transportation@danecountytimebank.org'}
                ]
            },
            {
                title: 'Bookkeeper',
                people: [
                    {name: 'Jerry Chernow', email: 'finance@danecountytimebank.org'}
                ]
            },
            {
                title: 'Development Director',
                people: [
                    {name: 'Bruce Moffat', email: 'moffat.bruce@gmail.com'}
                ]
            },
            {
                title: 'Founder',
                people: [
                    {name: 'Stephanie Rearick', email: 'steph@stephanierearick.com'}
                ]
            }
        ]
      };
    }
  };
</script>

<style>

.staff-details i {
    vertical-align: middle;
}
.staff-details i {
    color: #80a8d4;
}

</style>
