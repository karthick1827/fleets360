import { Link } from 'react-router-dom'
import './Placeholder.css'

export default function Placeholder({ title, description }) {
  return (
    <div className="placeholder-page">
      <h1>{title}</h1>
      <p>{description}</p>
      <Link to="/home">Back to Landing</Link>
    </div>
  )
}
