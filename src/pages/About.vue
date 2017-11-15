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

    <p>
        <strong>
        Increasing efficiency, opportunity, and resource sharing through mutually beneficial exchange -
        Building community ties and self-sufficiency for individuals and organizations in Dane County.
        </strong>
    </p>
    <p>
        The Dane County TimeBank (DCTB), established in 2005, is a network of over 2500 individuals and organizations who exchange services and skills to build community, build capacity, and come together to help each other to build a better world. In timebanking, everyone's contribution is valued equally - one hour equals one hour - and services exchanged help to fill resource gaps in the community. Anyone can join the TimeBank to offer skill or services - and receive services in exchange.
    </p>
    <p>
        The Dane County TimeBank has become a valuable tool to build programs that help solve challenges identified by the community - collaborating with community partners Dane County Human Services, Madison School District, and other supporters and participants to connect unmet needs with unused resources. Our projects provide meaningful ways for members to tap into to the network and offer needed skills and services.
    </p>
    <p>
        In addition to our local efforts, Time for the World is a project of the Dane County TimeBank working to build a world-wide cooperative network – Mutual Aid Networks – connecting timebanking with other cooperative practice to spread a generative community economy.
    </p>

    </f7-block>
  </f7-page>
</template>

<script>
  export default {
    name: 'About',
    data () {
      return {
        title: 'Dane County TimeBank'
      };
    }
  };
</script>
