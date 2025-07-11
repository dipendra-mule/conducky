import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: 'Secure & Confidential',
    Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
    description: (
      <>
        End-to-end security with role-based access control ensures incident data remains confidential. 
        Only authorized response team members can access sensitive information.
      </>
    ),
  },
  {
    title: 'Mobile-First Design',
    Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default,
    description: (
      <>
        Optimized for mobile devices where most incident reporting happens. 
        Clean, accessible interface works seamlessly on phones, tablets, and desktops.
      </>
    ),
  },
  {
    title: 'Multi-Event Platform',
    Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
    description: (
      <>
        Manage multiple events, organizations, and teams from a single installation. 
        Complete data isolation ensures privacy between different events and organizations.
      </>
    ),
  },
  {
    title: 'Secure Reporting',
    Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
    description: (
      <>
        Secure incident reporting with role-based access control and encrypted data storage. 
        Protect sensitive information throughout the incident response process.
      </>
    ),
  },
  {
    title: 'Audit Trail',
    Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default,
    description: (
      <>
        Comprehensive logging of all actions for accountability and compliance. 
        Track incident progress and team responses with detailed audit records.
      </>
    ),
  },
  {
    title: 'Open Source',
    Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
    description: (
      <>
        Fully open source and self-hostable. No vendor lock-in, complete control over your data, 
        and the ability to customize for your organization's specific needs.
      </>
    ),
  },
];

function Feature({Svg, title, description}) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="text--center margin-bottom--xl">
          <Heading as="h2">Key Features</Heading>
          <p className="hero__subtitle">
            Built specifically for incident management with privacy, security, and usability in mind
          </p>
        </div>
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
