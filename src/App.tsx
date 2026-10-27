import { MotionConfig } from 'motion/react'
import { SmoothScroll } from './lib/scroll'
import { useTheme } from './lib/theme'
import { Agents } from './sections/Agents'
import { Approvals } from './sections/Approvals'
import { Faq } from './sections/Faq'
import { FinalCta, Footer } from './sections/Closing'
import { Hero } from './sections/Hero'
import { MeetOrby } from './sections/MeetOrby'
import { Nav } from './sections/Nav'
import { Privacy } from './sections/Privacy'
import { Sounds } from './sections/Sounds'
import { Usage } from './sections/Usage'

export default function App() {
  const { theme, toggle } = useTheme()
  return (
    <MotionConfig reducedMotion="user">
      <SmoothScroll>
        <a className="skip" href="#meet">
          Skip to content
        </a>
        <Nav theme={theme} onToggleTheme={toggle} />
        <main>
          <Hero />
          <MeetOrby />
          <Approvals />
          <Agents />
          <Usage />
          <Sounds />
          <Privacy />
          <Faq />
          <FinalCta />
        </main>
        <Footer />
      </SmoothScroll>
    </MotionConfig>
  )
}
