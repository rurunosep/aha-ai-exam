interface DashboardPageProps {
	logout: () => void
	user: IUser
}

export default function DashboardPage({ logout, user }: DashboardPageProps) {
	return (
		<div>
			<h1>DashboardPage</h1>
			<button onClick={logout}>Logout</button>
			{user && user.verified ? 'Verified. Heres the data and stuff' : 'Need to verify'}
		</div>
	)
}
