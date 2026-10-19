<script setup>
import { ref } from 'vue'
import '../styles/landing.css'
import ContactSection from '../components/ContactSection.vue'
import CtaSection from '../components/CtaSection.vue'
import FaqSection from '../components/FaqSection.vue'
import FeatureGroup from '../components/FeatureGroup.vue'
import HeroSection from '../components/HeroSection.vue'
import LandingFooter from '../components/LandingFooter.vue'
import LandingHeader from '../components/LandingHeader.vue'
import PillarsOverview from '../components/PillarsOverview.vue'
import QuestionTypesSection from '../components/QuestionTypesSection.vue'
import RolesSection from '../components/RolesSection.vue'
import SectionHeading from '../components/SectionHeading.vue'
import TrustSection from '../components/TrustSection.vue'
import WorkflowSection from '../components/WorkflowSection.vue'
import { useActiveSection } from '../composables/useActiveSection'
import { useReveal } from '../composables/useReveal'
import { mailtoLink, whatsappLink } from '../data/config'
import { NAV_LINKS } from '../data/navigation'
import { PILLARS } from '../data/pillars'

// Landing page publik: statis, tanpa panggilan API, tampil walau backend mati.

const root = ref(null)
const hasContact = Boolean(mailtoLink() || whatsappLink())
const active = useActiveSection(NAV_LINKS.map((l) => l.id))
useReveal(root)
</script>

<template>
  <div ref="root" class="landing">
    <LandingHeader :links="NAV_LINKS" :active="active" />
    <main id="konten" tabindex="-1" class="landing-main">
      <HeroSection />
      <PillarsOverview />
      <section id="fitur" class="landing-section" aria-labelledby="fitur-judul">
        <div class="landing-container">
          <SectionHeading
            id="fitur-judul"
            eyebrow="Fitur"
            title="Semua kebutuhan sekolah dalam enam pilar"
            lead="Fitur yang belum tersedia ditandai Segera hadir."
          />
          <div class="feature-groups">
            <FeatureGroup v-for="pillar in PILLARS" :key="pillar.id" :pillar="pillar" />
          </div>
        </div>
      </section>
      <QuestionTypesSection />
      <WorkflowSection />
      <RolesSection />
      <TrustSection />
      <FaqSection />
      <ContactSection v-if="hasContact" />
      <CtaSection />
    </main>
    <LandingFooter />
  </div>
</template>
