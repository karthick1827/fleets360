import { Link } from 'react-router-dom'
import logoFleet360 from '../assets/fleet360/logo-fleet360-landing.svg'
import iconDevices from '../assets/fleet360/icon-devices.svg'
import iconSites from '../assets/fleet360/icon-sites.svg'
import iconUsers from '../assets/fleet360/icon-users.svg'
import './Landing.css'

const cards = [
  {
    id: 'devices',
    title: 'Devices',
    description:
      'Manage devices effortlessly with unified control and real-time insights.',
    cta: 'Manage Devices',
    to: '/devices',
    icon: iconDevices,
    nodeIcon: '227:3932',
  },
  {
    id: 'sites',
    title: 'Sites',
    description:
      'Manage sites with seamless oversight and instant control with visual hierarchy',
    cta: 'Manage Sites',
    to: '/sites',
    icon: iconSites,
    nodeIcon: '227:3946',
  },
  {
    id: 'users',
    title: 'Users',
    description:
      'Assigns roles per site with granular access controls for easy user management.',
    cta: 'Manage Users',
    to: '/users',
    icon: iconUsers,
    nodeIcon: '227:3962',
  },
]

export default function Landing() {
  return (
    <div className="landing-page" data-node-id="227:3884">
      <header className="landing-hero" data-node-id="227:3885">
        <div className="landing-hero__inner" data-node-id="621:20893">
          <img
            className="landing-hero__logo"
            src={logoFleet360}
            alt="Fleet 360"
            width={315}
            height={56}
            data-node-id="4003:14139"
          />
          <div className="landing-hero__copy" data-node-id="227:3922">
            <div className="landing-hero__welcome" data-node-id="227:3924">
              <p className="landing-hero__welcome-line" data-node-id="227:3925">
                Welcome to
              </p>
              <p className="landing-hero__title" data-node-id="227:3926">
                <span className="landing-hero__title-bold">Fleet </span>
                <span>360</span>
              </p>
            </div>
            <p className="landing-hero__body" data-node-id="227:3927">
              Complete visibility into your data, total control over your insights.
              Empowering secure, real-time analytics with precision and speed.
            </p>
          </div>
        </div>
      </header>

      <section className="landing-hub" data-node-id="227:3928">
        {cards.map((card) => (
          <article key={card.id} className="landing-card">
            <img
              className="landing-card__icon"
              src={card.icon}
              alt=""
              width={48}
              height={48}
              data-node-id={card.nodeIcon}
            />
            <div className="landing-card__body">
              <div className="landing-card__heading">
                <h2 className="landing-card__title">{card.title}</h2>
                <p className="landing-card__description">{card.description}</p>
              </div>
              <Link className="landing-card__cta" to={card.to}>
                {card.cta}
              </Link>
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}
