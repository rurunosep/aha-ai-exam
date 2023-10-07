import {
  useCallback, useContext, useEffect, useState,
} from 'react';
import axios from 'axios';
import { Context } from './context';
import LandingPage from './landingPage/LandingPage';
import DashboardPage from './dashboard/DashboardPage';

export default function App() {
  const [user, setUser] = useState<IUser | null>(null);

  const { alert, setAlert } = useContext(Context);

  // Get authenticated user of the current session
  useEffect(() => {
    axios.get('api/auth/user').then((res) => {
      setUser(res.data ? res.data : null);
    });
  }, []);

  //
  const login = useCallback((email: string, password: string) => {
    axios
      .post('api/auth/login', { email, password })
      .then(() => axios.get('api/auth/user'))
      .then((res) => {
        setUser(res.data ? res.data : null);
      })
      .catch((err) => {
        setAlert({ message: err.response.data, type: 'danger' });
      });
  }, []);

  //
  const logout = useCallback(() => {
    axios.get('api/auth/logout').then(() => {
      setUser(null);
    });
  }, []);

  //
  const changeName = useCallback(
    (newName: string) => {
      axios
        .post('api/user/change-display-name', { newName })
        .then(() => user && setUser({ ...user, displayName: newName }))
        .catch((err) => {
          setAlert({ message: err.response.data, type: 'danger' });
        });
    },
    [user],
  );

  //
  const changePassword = useCallback(
    (oldPassword: string, newPassword: string) => {
      axios
        .post('api/user/change-password', { oldPassword, newPassword })
        .then((res) => setAlert({ message: res.data, type: 'success' }))
        .catch((err) => setAlert({ message: err.response.data, type: 'danger' }));
    },
    [],
  );

  //
  const register = useCallback((email: string, password: string) => {
    axios
      .post('api/auth/register', { email, password })
      .then((res) => {
        setAlert({ message: res.data, type: 'success' });
        login(email, password);
      })
      .catch((err) => setAlert({ message: err.response.data, type: 'danger' }));
  }, []);

  //
  const alertElement = alert && (
    <div className={`alert alert-${alert.type} alert-dismissible`} role="alert">
      {alert.message}
      <button
        type="button"
        className="btn-close"
        onClick={() => setAlert(null)}
        aria-label="Close"
      />
    </div>
  );

  return (
    <div className="container mt-3 mb-3">
      {alertElement}
      {user ? (
        <DashboardPage
          user={user}
          logout={logout}
          changeName={changeName}
          changePassword={changePassword}
        />
      ) : (
        <LandingPage login={login} register={register} />
      )}
    </div>
  );
}
