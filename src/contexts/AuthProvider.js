import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AuthContext = createContext();

export function useAuthContext() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [auth, setAuth] = useState(false);
    const [name, setName] = useState('');
    const navigate = useNavigate();

    const checkAuth = () => {
        axios.defaults.withCredentials = true;
        axios
            .get('/')
            .then(res => {
                if (res.status === 200) {
                    setAuth(true);
                    setName(res.data.name);
                }
            })
            .catch(err => {
                if (err.response.status === 401) navigate('/login');
                else console.log(err);
            });
    }

    useEffect(() => {
        checkAuth();
    }, []);

    const handleDelete = () => {
        axios.defaults.withCredentials = true;
        setAuth(false);
        axios
            .get('/auth/logout')
            .then(res => {
                navigate('/login');
            })
            .catch(err => console.log(err));
    };

    return (
        <AuthContext.Provider value={{ auth, name, handleDelete, checkAuth }}>
            {children}
        </AuthContext.Provider>
    );
}
