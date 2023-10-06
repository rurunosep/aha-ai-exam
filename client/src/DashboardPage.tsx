import { useCallback, useContext, useEffect, useState } from 'react'
import ChangeNameForm from './ChangeNameForm'
import ChangePasswordForm from './ChangePasswordForm'
import { Context } from './context'
import axios from 'axios'

interface DashboardPageProps {
	user: IUser
	logout: () => void
	changeName: (newName: string) => void
	changePassword: (oldPassword: string, newPassword: string) => void
}

interface GlobalStats {
	totalUsers: string
	usersActiveToday: string
	usersActiveLast7Days: string
}

interface UserListRow {
	id: string
	email: string
	registered: string
	timesLoggedIn: string
	lastActive: string
}

export default function DashboardPage({
	user,
	logout,
	changeName,
	changePassword,
}: DashboardPageProps) {
	const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null)
	const [userList, setUserList] = useState<UserListRow[]>([])
	const [page, _setPage] = useState(1)

	const { setAlert } = useContext(Context)

	useEffect(() => {
		axios.get('api/data/global-stats').then((res) => {
			setGlobalStats(res.data)
		})
	}, [])

	useEffect(() => {
		axios
			.get(`api/data/user-list?page=${page}&limit=10`)
			.then((res) => {
				setUserList(res.data)
			})
			.catch()
	}, [])

	const resendEmail = useCallback(() => {
		axios
			.get('api/auth/resend-verification-email')
			.then(() => setAlert({ message: 'Verification email sent', type: 'success' }))
	}, [])

	const profileSection = (
		<>
			<div className='card mb-3'>
				<div className='card-body'>
					<p>Email: {user.email}</p>
					<p>Name: {user.displayName}</p>
				</div>
			</div>
			<div className='card mb-3'>
				<div className='card-body'>
					<ChangeNameForm changeName={changeName} />
				</div>
			</div>
			<div className='card mb-3'>
				<div className='card-body'>
					<ChangePasswordForm changePassword={changePassword} />
				</div>
			</div>
			<div className='card'>
				<div className='card-body'>
					<button className='btn btn-primary' onClick={logout}>
						Logout
					</button>
				</div>
			</div>
		</>
	)

	const userStatsAndList = (
		<>
			<div className='card mb-3'>
				<div className='card-body'>
					<div className='row'>
						<div className='col'>Total Users: {globalStats?.totalUsers}</div>
						<div className='col	'>Users Active Today: {globalStats?.usersActiveToday}</div>
						<div className='col'>
							Users Active in Last 7 Days: {globalStats?.usersActiveLast7Days}
						</div>
					</div>
				</div>
			</div>
			<div className='card'>
				<div className='card-body'>
					<table className='table'>
						<thead>
							<tr>
								<th>Email</th>
								<th>Signed Up</th>
								<th>Times Logged On</th>
								<th>Last Active</th>
							</tr>
						</thead>
						<tbody>
							{userList.map((x) => (
								<tr key={x.id}>
									<td>{x.email}</td>
									<td>{x.registered}</td>
									<td>{x.timesLoggedIn}</td>
									<td>{x.lastActive}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
				{/* TODO very simple pagination */}
			</div>
		</>
	)

	const verificationPrompt = (
		<div className='card'>
			<div className='card-body'>
				<p>Must verify email to view dashboard.</p>
				<button className='btn btn-primary' onClick={resendEmail}>
					Resend Email
				</button>
			</div>
		</div>
	)

	return (
		<div className='row'>
			<div className='col-3'>{profileSection}</div>
			<div className='col'>{user.verified ? userStatsAndList : verificationPrompt}</div>
		</div>
	)
}
