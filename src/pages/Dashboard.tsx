import { useAuth } from '../auth/AuthContext'

export default function Dashboard() {
  const { user } = useAuth()

  return (
    <div>
      <h1>Xoş gəlmisiniz, {user?.name}</h1>
      <p>Bu, Herba Admin idarəetmə panelinin ana səhifəsidir.</p>
    </div>
  )
}
