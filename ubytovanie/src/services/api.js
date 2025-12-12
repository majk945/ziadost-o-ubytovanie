import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Študenti (P5.1, P5.2, P5.3)
export const studentApi = {
  // P5.1, P5.2 - Prihlásenie
  login: (email) => api.post('/students/login', { email }),
  
  // Získanie študenta
  getStudent: (id) => api.get(`/students/${id}`),
  
  // P5.3 - Aktualizácia údajov
  updateStudent: (id, data) => api.put(`/students/${id}`, data),
  
  // Všetci študenti
  getAllStudents: () => api.get('/students'),
};

// Žiadosti (P1.1, P1.2, P1.3, P1.4)
export const ziadostApi = {
  // P1.1 - Vytvorenie žiadosti
  createZiadost: (data) => api.post('/ziadosti', data),
  
  // P1.2 - Detail žiadosti
  getZiadost: (id) => api.get(`/ziadosti/${id}`),
  
  // P1.2 - Žiadosti študenta
  getStudentZiadosti: (studentId) => api.get(`/ziadosti/student/${studentId}`),
  
  // P1.3 - Úprava žiadosti
  updateZiadost: (id, data) => api.put(`/ziadosti/${id}`, data),
};

// Odvolania (P2.1, P2.2, P2.3, P2.4)
export const odvolanieApi = {
  // P2.1 - Podanie odvolania
  createOdvolanie: (data) => api.post('/odvolania', data),
  
  // P2.2 - Detail odvolania
  getOdvolanie: (id) => api.get(`/odvolania/${id}`),
  
  // P2.2 - Odvolania študenta
  getStudentOdvolania: (studentId) => api.get(`/odvolania/student/${studentId}`),
  
  // P2.2 - Všetky odvolania (admin)
  getAllOdvolania: (stav) => api.get('/odvolania', { params: { stav } }),
  
  // P2.3 - Vyhodnotenie odvolania
  vyhodnotitOdvolanie: (id, data) => api.put(`/odvolania/${id}/vyhodnotit`, data),
};

// Hodnotenia (P3.1, P3.2, P3.3)
export const hodnoteniaApi = {
  // P3.1 - Kritériá
  getKriteria: (stav) => api.get('/hodnotenia/kriteria', { params: { stav } }),
  createKriterium: (data) => api.post('/hodnotenia/kriteria', data),
  updateKriterium: (id, data) => api.put(`/hodnotenia/kriteria/${id}`, data),
  updateKriteriumStav: (id, stav) => api.patch(`/hodnotenia/kriteria/${id}/stav`, { stav }),
  
  // P3.2 - Hodnotenia žiadosti
  getHodnotenia: (idZiadosti) => api.get(`/hodnotenia/${idZiadosti}`),
  
  // P3.2, P3.3 - Prepočet bodov
  prepocitajBody: (idZiadosti) => api.post(`/hodnotenia/${idZiadosti}/prepocitaj`),
};

// Notifikácie (P6.1, P6.2, P6.3)
export const notifikaciaApi = {
  // P6.1, P6.2 - Notifikácie študenta
  getStudentNotifikacie: (studentId) => api.get(`/notifikacie/student/${studentId}`),
  
  // P6.1 - Vytvorenie notifikácie
  createNotifikacia: (data) => api.post('/notifikacie', data),
  
  // P6.3 - Aktualizácia stavu
  updateStav: (id, stav) => api.patch(`/notifikacie/${id}/stav`, { stav }),
  
  // Všetky notifikácie (admin)
  getAllNotifikacie: (stav) => api.get('/notifikacie', { params: { stav } }),
};

// Administrácia (P4.1, P4.2, P4.3)
export const adminApi = {
  // P4.1 - Automatické vyhodnotenie
  vyhodnotit: (data) => api.post('/admin/vyhodnotit', data),
  
  // P4.2 - Manuálne schválenie
  schvalit: (data) => api.post('/admin/schvalit', data),
  
  // P4.3 - Pridelenie miestností
  pridelitMiestnosti: (data) => api.post('/admin/pridelit-miestnosti', data),
  
  // Prehľad žiadostí
  getZiadosti: (akademickyRok, stav) => 
    api.get('/admin/ziadosti', { params: { akademicky_rok: akademickyRok, stav } }),
};

export default api;