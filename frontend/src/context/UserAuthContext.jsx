// import { createContext, useContext, useState, useEffect } from 'react';
// import axios from 'axios';

// const UserAuthContext = createContext();

// const extractUser = (payload) => payload?.user || payload || null;

// export const UserAuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [isUserAuthenticated, setIsUserAuthenticated] = useState(false);
//   const [userLoading, setUserLoading] = useState(true);

//   useEffect(() => {
//     const checkUserAuth = async () => {
//       const token = localStorage.getItem('userToken');
//       if (!token) {
//         setUserLoading(false);
//         return;
//       }

//       try {
//         axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
//         const res = await axios.get('/api/users/profile');
//         if (res.data.success) {
//           setUser(extractUser(res.data.data));
//           setIsUserAuthenticated(true);
//         }
//       } catch (err) {
//         localStorage.removeItem('userToken');
//         delete axios.defaults.headers.common['Authorization'];
//       } finally {
//         setUserLoading(false);
//       }
//     };
//     checkUserAuth();
//   }, []);

//   const refreshUserProfile = async () => {
//     const res = await axios.get('/api/users/profile');
//     if (res.data.success) {
//       const nextUser = extractUser(res.data.data);
//       setUser(nextUser);
//       return nextUser;
//     }
//     return null;
//   };

//   const userLogin = async (email, password) => {
//     const res = await axios.post('/api/users/login', { email, password });
//     if (res.data.success) {
//       localStorage.setItem('userToken', res.data.data.token);
//       axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.data.token}`;
//       setUser(extractUser(res.data.data));
//       setIsUserAuthenticated(true);
//       return res.data;
//     }
//   };

//   const userRegister = async (username, email, password, phone) => {
//     const res = await axios.post('/api/users/register', { username, email, password, phone });
//     if (res.data.success) {
//       localStorage.setItem('userToken', res.data.data.token);
//       axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.data.token}`;
//       setUser(extractUser(res.data.data));
//       setIsUserAuthenticated(true);
//       return res.data;
//     }
//   };

//   const userLogout = async () => {
//     try {
//       // Notify backend to clear cookies
//       await axios.post('/api/users/logout');
//     } catch (err) {
//       console.error("❌ User Logout API Error:", err.message);
//     } finally {
//       localStorage.removeItem('userToken');
//       delete axios.defaults.headers.common['Authorization'];
//       setUser(null);
//       setIsUserAuthenticated(false);
//     }
//   };

//   return (
//     <UserAuthContext.Provider value={{ user, isUserAuthenticated, userLoading, userLogin, userRegister, userLogout, refreshUserProfile }}>
//       {children}
//     </UserAuthContext.Provider>
//   );
// };

// export const useUserAuth = () => useContext(UserAuthContext);





import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { getRequestErrorMessage } from '../utils/httpError';

const UserAuthContext = createContext(null);

const extractUser = (payload) => payload?.user || payload || null;

export const UserAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(false);
  const [userLoading, setUserLoading] = useState(true);

  useEffect(() => {
    const checkUserAuth = async () => {
      const token = localStorage.getItem('userToken');

      if (!token) {
        setUserLoading(false);
        return;
      }

      try {
        axios.defaults.headers.common[
          'Authorization'
        ] = `Bearer ${token}`;

        const res = await axios.get('/api/users/profile');

        if (res.data.success) {
          setUser(extractUser(res.data.data));
          setIsUserAuthenticated(true);
        }
      } catch (err) {
        console.error(err);

        localStorage.removeItem('userToken');

        delete axios.defaults.headers.common['Authorization'];
      } finally {
        setUserLoading(false);
      }
    };

    checkUserAuth();
  }, []);

  const refreshUserProfile = async () => {
    const res = await axios.get('/api/users/profile');

    if (res.data.success) {
      const nextUser = extractUser(res.data.data);

      setUser(nextUser);

      return nextUser;
    }

    return null;
  };

  const userLogin = async (email, password) => {
    try {
      const res = await axios.post('/api/users/login', {
        email,
        password,
      });

      if (res.data.success) {
        localStorage.setItem('userToken', res.data.data.token);

        axios.defaults.headers.common[
          'Authorization'
        ] = `Bearer ${res.data.data.token}`;

        setUser(extractUser(res.data.data));

        setIsUserAuthenticated(true);

        return res.data;
      }
    } catch (error) {
      return {
        success: false,
        error: getRequestErrorMessage(error, 'Login failed'),
      };
    }
  };

  const userRegister = async (
    username,
    email,
    password,
    phone
  ) => {
    try {
      const res = await axios.post('/api/users/register', {
        username,
        email,
        password,
        phone,
      });

      if (res.data.success) {
        localStorage.setItem('userToken', res.data.data.token);

        axios.defaults.headers.common[
          'Authorization'
        ] = `Bearer ${res.data.data.token}`;

        setUser(extractUser(res.data.data));

        setIsUserAuthenticated(true);

        return res.data;
      }
    } catch (error) {
      return {
        success: false,
        error: getRequestErrorMessage(error, 'Registration failed'),
      };
    }
  };

  const userLogout = async () => {
    try {
      await axios.post('/api/users/logout');
    } catch (err) {
      console.error('Logout Error:', err.message);
    } finally {
      localStorage.removeItem('userToken');

      delete axios.defaults.headers.common['Authorization'];

      setUser(null);

      setIsUserAuthenticated(false);
    }
  };

  return (
    <UserAuthContext.Provider
      value={{
        user,
        isUserAuthenticated,
        userLoading,
        userLogin,
        userRegister,
        userLogout,
        refreshUserProfile,
      }}
    >
      {children}
    </UserAuthContext.Provider>
  );
};

export const useUserAuth = () => {
  const context = useContext(UserAuthContext);

  if (!context) {
    throw new Error(
      'useUserAuth must be used inside UserAuthProvider'
    );
  }

  return context;
};
