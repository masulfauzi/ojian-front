<script setup>
import Accordion from 'primevue/accordion'
import AccordionContent from 'primevue/accordioncontent'
import AccordionHeader from 'primevue/accordionheader'
import AccordionPanel from 'primevue/accordionpanel'
import { FAQ } from '../data/faq'
</script>

<template>
  <Accordion class="landing-faq">
    <AccordionPanel v-for="item in FAQ" :key="item.id" :value="item.id">
      <AccordionHeader>{{ item.question }}</AccordionHeader>
      <AccordionContent>
        <p class="landing-faq__answer">{{ item.answer }}</p>
      </AccordionContent>
    </AccordionPanel>
  </Accordion>
</template>
