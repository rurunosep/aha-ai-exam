import { useState, useContext } from 'react'
import { Context } from './context'

interface ChangePasswordFormProps {
	changePassword: (oldPassword: string, newPassword: string) => void
}

export default function ChangePasswordForm({ changePassword }: ChangePasswordFormProps) {
	const [fields, setFields] = useState({ oldPassword: '', newPassword1: '', newPassword2: '' })

	const { setAlert } = useContext(Context)

	const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFields({ ...fields, [e.target.name]: e.target.value })
	}

	const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()

		const validPasswordRegex = /^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z]).{8,}$/
		if (!validPasswordRegex.test(fields.newPassword1)) {
			setAlert({
				message:
					'Password must contain 1 uppercase, 1 lowercase, 1 number, 1 special character, and 8+ characters in total.',
				type: 'danger',
			})
			return
		}

		if (fields.newPassword1 != fields.newPassword2) {
			setAlert({ message: 'Passwords must match.', type: 'danger' })
			return
		}

		changePassword(fields.oldPassword, fields.newPassword1)
		setFields({ oldPassword: '', newPassword1: '', newPassword2: '' })
	}

	return (
		<form onSubmit={onSubmit}>
			<div className='mb-3'>
				<input
					type='password'
					className='form-control'
					name='oldPassword'
					placeholder='Current Password'
					value={fields.oldPassword}
					onChange={onChange}
				/>
			</div>
			<div className='mb-3'>
				<input
					type='password'
					className='form-control'
					name='newPassword1'
					placeholder='New Password'
					value={fields.newPassword1}
					onChange={onChange}
				/>
			</div>
			<div className='mb-3'>
				<input
					type='password'
					className='form-control'
					name='newPassword2'
					placeholder='Confirm New Password'
					value={fields.newPassword2}
					onChange={onChange}
				/>
			</div>
			<button type='submit' className='btn btn-primary'>
				Change Password
			</button>
		</form>
	)
}
