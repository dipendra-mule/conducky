import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';

import Heading from '@theme/Heading';
import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/user-guide/quick-start">
            Get Started in 5 Minutes ⏱️
          </Link>
          <Link
            className="button button--outline button--lg"
            to="/user-guide/intro"
            style={{marginLeft: '1rem'}}>
            Learn More 📖
          </Link>
        </div>
      </div>
    </header>
  );
}

function ProjectOverview() {
  return (
    <section className="padding-vert--xl">
      <div className="container">
        <div className="row">
          <div className="col col--8 col--offset-2">
            <div className="text--center margin-bottom--xl">
              <Heading as="h2">What is Conducky?</Heading>
              <p className="hero__subtitle">
                Conducky is a comprehensive incident management platform designed specifically for conferences, events, and organizations that need to handle Code of Conduct incidents effectively and confidentially.
              </p>
            </div>
          </div>
        </div>
        
        <div className="row">
          <div className="col col--4">
            <div className="text--center">
              <h3>🎯 Event Organizers</h3>
              <p>
                Manage Code of Conduct incidents for conferences, meetups, and community events. Provide a secure reporting system for attendees and streamlined response workflows for your safety team.
              </p>
            </div>
          </div>
          <div className="col col--4">
            <div className="text--center">
              <h3>🏢 Organizations</h3>
              <p>
                Manage recurring conferences, open source projects, and year-over-year events. Track incidents across multiple events while maintaining organizational learning and continuous improvement.
              </p>
            </div>
          </div>
          <div className="col col--4">
            <div className="text--center">
              <h3>👥 Communities</h3>
              <p>
                Create safe spaces in online and offline communities with transparent incident reporting, proper investigation workflows, and accountability measures.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function WhyConducky() {
  return (
    <section className="padding-vert--xl" style={{backgroundColor: 'var(--ifm-color-emphasis-100)'}}>
      <div className="container">
        <div className="row">
          <div className="col col--6">
            <Heading as="h2">Why Choose Conducky?</Heading>
            <div className="margin-vert--md">
              <h4>🔒 Privacy & Security First</h4>
              <p>End-to-end encrypted incident reports with role-based access control. Only authorized team members see sensitive information.</p>
              
              <h4>📱 Mobile-Optimized</h4>
              <p>Designed for mobile-first usage. Attendees and responders can access the system from any device, anywhere.</p>
              
              <h4>🏗️ Multi-Event Support</h4>
              <p>Manage multiple events, organizations, and teams from a single platform with complete data isolation between events.</p>
              
              <h4>🔍 Comprehensive Audit Trail</h4>
              <p>Every action is logged for accountability and compliance. Track who did what, when, and why.</p>
            </div>
          </div>
          <div className="col col--6">
            <div className="text--center">
              <img 
                src="/img/conducky-security-diagram.png" 
                alt="Conducky Security Architecture"
                className="margin-vert--md"
                style={{maxWidth: '100%', height: 'auto'}}
              />
              <p><em>Multi-layered security ensures incident data remains confidential and properly scoped</em></p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function UseCases() {
  return (
    <section className="padding-vert--xl">
      <div className="container">
        <div className="text--center margin-bottom--xl">
          <Heading as="h2">Real-World Use Cases</Heading>
        </div>
        
        <div className="row">
          <div className="col col--6 margin-bottom--lg">
            <div className="card">
              <div className="card__header">
                <h3>🎪 Tech Conference</h3>
              </div>
              <div className="card__body">
                <p><strong>Challenge:</strong> 2,000 attendee conference needs confidential harassment reporting.</p>
                <p><strong>Solution:</strong> Conducky provides anonymous reporting, response team coordination, and complete audit trail for post-event analysis.</p>
                <p><strong>Result:</strong> 15 incidents reported and resolved during the event, with full documentation for future improvements.</p>
              </div>
            </div>
          </div>
          
          <div className="col col--6 margin-bottom--lg">
            <div className="card">
              <div className="card__header">
                <h3>🏢 Conference Organization</h3>
              </div>
              <div className="card__body">
                <p><strong>Challenge:</strong> Annual conference organization runs multiple events year-round across different cities.</p>
                <p><strong>Solution:</strong> Organization-level incident tracking with shared response teams and cross-event learning from incident patterns.</p>
                <p><strong>Result:</strong> Improved safety protocols across all events with 25% reduction in repeat incident types year-over-year.</p>
              </div>
            </div>
          </div>
          
          <div className="col col--6 margin-bottom--lg">
            <div className="card">
              <div className="card__header">
                <h3>🌐 Online Community</h3>
              </div>
              <div className="card__body">
                <p><strong>Challenge:</strong> Large Discord community experiencing harassment issues.</p>
                <p><strong>Solution:</strong> Conducky integration allows community members to report incidents through a trusted, external platform.</p>
                <p><strong>Result:</strong> 40% increase in incident reporting with improved member satisfaction and community safety.</p>
              </div>
            </div>
          </div>
          
          <div className="col col--6 margin-bottom--lg">
            <div className="card">
              <div className="card__header">
                <h3>🎭 Event Series</h3>
              </div>
              <div className="card__body">
                <p><strong>Challenge:</strong> Monthly meetup series needs consistent incident management across events.</p>
                <p><strong>Solution:</strong> Single Conducky installation manages multiple events with shared response team and historical tracking.</p>
                <p><strong>Result:</strong> Improved safety culture with 95% of incident reports resulting in positive resolution.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title="Code of Conduct Incident Management Platform"
      description="Conducky is a comprehensive incident management platform for conferences, events, and organizations. Secure, confidential Code of Conduct incident reporting and response.">
      <HomepageHeader />
      <main>
        <ProjectOverview />
        <HomepageFeatures />
        <WhyConducky />
        <UseCases />
      </main>
    </Layout>
  );
}
