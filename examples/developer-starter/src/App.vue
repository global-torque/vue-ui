<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue';
import { Button } from '@global-torque/ui-primitives/button';
import { OfferCard } from '@global-torque/invest-widgets/offers';
import { ProfileSelector } from '@global-torque/invest-widgets/profiles';
import { useOffers } from './useOffers';
const { offers, selected, loading, error, mode, scenario, load, open, retry } = useOffers();
const profile = ref('personal');
const dark = ref(false);
const heading = ref<HTMLHeadingElement>();
async function focusHeading() {
  await nextTick();
  if (!loading.value) heading.value?.focus();
}
async function showOffer(id: string) { await open(id); await focusHeading(); }
async function showOffers() { await load(); await focusHeading(); }
const profiles = [{ id: 'personal', label: 'Personal workspace', description: 'Demonstration profile' }, { id: 'team', label: 'Team workspace', description: 'Demonstration profile' }];
function changeTheme() {
  dark.value = !dark.value;
  document.documentElement.dataset.theme = dark.value ? 'dark' : 'light';
}
onMounted(load);
</script>

<template>
  <div class="page">
    <header class="page-header">
      <a class="wordmark" href="/">Investment explorer</a>
      <Button type="button" variant="outline" :aria-pressed="dark" @click="changeTheme">{{ dark ? 'Light theme' : 'Dark theme' }}</Button>
    </header>
    <main>
      <div class="intro">
        <p class="eyebrow">Developer starter</p>
        <h1>Explore opportunities.<br>Build your own experience.</h1>
        <p class="lede">Browse offers and view the details that matter to you.</p>
      </div>
      <aside v-if="mode === 'fixture'" class="demo-notice" aria-label="Demonstration controls">
        <p><strong>Demonstration data.</strong> These fictional offers and profiles are for development. No live service or investment transaction is connected.</p>
        <label for="scenario">Preview state</label>
        <select id="scenario" v-model="scenario" @change="load">
          <option value="success">Offers available</option><option value="empty">No offers</option>
          <option value="slow">Loading</option><option value="error">Service unavailable</option>
          <option value="auth-error">Access rejected</option>
        </select>
      </aside>
      <p v-else-if="mode === 'live'" class="live-note">Live sandbox · Read-only offer explorer</p>
      <div class="workspace">
        <aside v-if="mode === 'fixture'" class="profiles">
          <h2>Your workspace</h2>
          <ProfileSelector :items="profiles" :selected-id="profile" @select="profile = $event" />
          <p class="muted">Selection stays in this browser session and does not change account permissions.</p>
        </aside>
        <section class="offers" aria-label="Offers">
          <div class="section-heading"><h2 ref="heading" tabindex="-1">{{ selected ? 'Offer details' : 'Available offers' }}</h2><Button v-if="selected" type="button" variant="outline" @click="showOffers">Back to offers</Button></div>
          <div v-if="error" class="error" role="alert"><h3>Unable to load offers</h3><p>{{ error }}</p><Button type="button" @click="retry">Retry</Button></div>
          <div v-else-if="loading" class="offer-grid"><OfferCard loading /><OfferCard loading /></div>
          <div v-else-if="selected" class="detail">
            <OfferCard :offer="selected" action-label="Back to offers" @select="showOffers" />
            <p class="muted">Review the full offer documents and your eligibility with the provider before making any decision.</p>
          </div>
          <div v-else-if="offers.length" class="offer-grid"><OfferCard v-for="offer in offers" :key="offer.id" :offer="offer" @select="showOffer" /></div>
          <div v-else class="empty" role="status"><h3>No offers available</h3><p>Check back later or refresh the list.</p><Button type="button" variant="outline" @click="load">Refresh offers</Button></div>
        </section>
      </div>
    </main>
    <footer>Built with Global Torque open-source packages. Your product owns its data, identity and decisions.</footer>
  </div>
</template>
