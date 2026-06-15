(function () {
  const base = () => window.KRS_CONFIG?.API_URL || '/api';

  const request = async (method, path, data, params) => {
    const token = localStorage.getItem('krs_token');
    let url = base() + path;

    if (params) {
      const q = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== null && v !== undefined && v !== '') q.append(k, v);
      });
      const qs = q.toString();
      if (qs) url += '?' + qs;
    }

    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;

    const opts = { method, headers };
    if (data != null) opts.body = JSON.stringify(data);

    let res;
    try {
      res = await fetch(url, opts);
    } catch {
      throw { message: 'Tidak dapat terhubung ke server' };
    }

    if (res.status === 401) {
      localStorage.removeItem('krs_token');
      localStorage.removeItem('krs_user');
      window.location.href = 'login.html';
      return;
    }

    let json;
    try { json = await res.json(); } catch { json = {}; }

    if (!res.ok) throw { status: res.status, message: json.message || 'Terjadi kesalahan', data: json };
    return json;
  };

  window.api = {
    get:    (path, params) => request('GET', path, null, params),
    post:   (path, data)   => request('POST', path, data),
    put:    (path, data)   => request('PUT', path, data),
    delete: (path)         => request('DELETE', path),
  };
})();
