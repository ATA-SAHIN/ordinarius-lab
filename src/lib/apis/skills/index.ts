import { WEBUI_API_BASE_URL } from '$lib/constants';
import { getOpenClawAvailableSkills } from '$lib/apis/openclaw';

export const createNewSkill = async (token: string, skill: object) => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/skills/create`, {
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			authorization: `Bearer ${token}`
		},
		body: JSON.stringify({
			...skill
		})
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.catch((err) => {
			error = err.detail;
			console.error(err);
			return null;
		});

	if (error) {
		throw error;
	}

	return res;
};

export const getSkills = async (token: string = '') => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/skills/`, {
		method: 'GET',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			authorization: `Bearer ${token}`
		}
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.then((json) => {
			return json;
		})
		.catch((err) => {
			error = err.detail;
			console.error(err);
			return null;
		});

	if (error) {
		throw error;
	}

	if (res && Array.isArray(res)) {
		try {
			const openclawSkills = await getOpenClawAvailableSkills(token);
			if (openclawSkills && Array.isArray(openclawSkills)) {
				return [...res, ...openclawSkills.map(s => ({
					...s,
					user: { name: 'OpenClaw', email: 'system@openclaw.engine' },
					write_access: true,
					content: `def get_skills():\n    return [{"name": "${s.id}", "description": "${s.description}"}]`,
					description: s.meta?.description ?? s.description,
					meta: { manifest: { version: 'OpenClaw Engine' } },
					is_active: true
				}))];
			}
		} catch (e) {
			console.warn('Failed to load OpenClaw skills natively', e);
		}
	}

	return res;
};

export const getSkillList = async (token: string = '') => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/skills/list`, {
		method: 'GET',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			authorization: `Bearer ${token}`
		}
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.then((json) => {
			return json;
		})
		.catch((err) => {
			error = err.detail;
			console.error(err);
			return null;
		});

	if (error) {
		throw error;
	}

	if (res && Array.isArray(res)) {
		try {
			const openclawSkills = await getOpenClawAvailableSkills(token);
			if (openclawSkills && Array.isArray(openclawSkills)) {
				return [...res, ...openclawSkills.map(s => ({
					...s,
					user: { name: 'OpenClaw', email: 'system@openclaw.engine' },
					write_access: true,
					content: `def get_skills():\n    return [{"name": "${s.id}", "description": "${s.description}"}]`,
					description: s.meta?.description ?? s.description,
					meta: { manifest: { version: 'OpenClaw Engine' } },
					is_active: true
				}))];
			}
		} catch (e) {
			console.warn('Failed to load OpenClaw skills natively', e);
		}
	}

	return res;
};

export const getSkillItems = async (
	token: string = '',
	query: string | null = null,
	viewOption: string | null = null,
	page: number | null = null
) => {
	let error = null;

	const searchParams = new URLSearchParams();
	if (query) searchParams.append('query', query);
	if (viewOption) searchParams.append('view_option', viewOption);
	if (page) searchParams.append('page', page.toString());

	const res = await fetch(`${WEBUI_API_BASE_URL}/skills/list?${searchParams.toString()}`, {
		method: 'GET',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			authorization: `Bearer ${token}`
		}
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.then((json) => {
			return json;
		})
		.catch((err) => {
			error = err;
			console.error(err);
			return null;
		});

	if (error) {
		throw error;
	}

	if (res && res.items && Array.isArray(res.items)) {
		try {
			const openclawSkills = await getOpenClawAvailableSkills(token);
			if (openclawSkills && Array.isArray(openclawSkills)) {
				const ocSkills = openclawSkills.map(s => ({
					...s,
					user: { name: 'OpenClaw', email: 'system@openclaw.engine' },
					write_access: false,
					description: s.meta?.description ?? s.description,
					is_active: true
				}));
				res.items = [...res.items, ...ocSkills];
				if (typeof res.total === 'number') {
					res.total += ocSkills.length;
				}
			}
		} catch (e) {
			console.warn('Failed to load OpenClaw skills natively', e);
		}
	}

	return res;
};

export const exportSkills = async (token: string = '') => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/skills/export`, {
		method: 'GET',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			authorization: `Bearer ${token}`
		}
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.then((json) => {
			return json;
		})
		.catch((err) => {
			error = err.detail;
			console.error(err);
			return null;
		});

	if (error) {
		throw error;
	}

	return res;
};

export const getSkillById = async (token: string, id: string) => {
	let error = null;

	if (id && id.startsWith('openclaw.')) {
		try {
			const openclawSkills = await getOpenClawAvailableSkills(token);
			const found = (openclawSkills || []).find((s: any) => s.id === id);
			if (found) {
				return {
					...found,
					user: { name: 'OpenClaw', email: 'system@openclaw.engine' },
					write_access: true,
					content: `def get_skills():\n    return [{"name": "${found.id}", "description": "${found.description}"}]`,
					description: found.meta?.description ?? found.description,
					meta: { manifest: { version: 'OpenClaw Engine' } },
					is_active: true
				};
			}
		} catch (e) {
			console.warn('Failed to intercept skill id', e);
		}
	}

	const res = await fetch(`${WEBUI_API_BASE_URL}/skills/id/${id}`, {
		method: 'GET',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			authorization: `Bearer ${token}`
		}
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.then((json) => {
			return json;
		})
		.catch((err) => {
			error = err.detail;
			console.error(err);
			return null;
		});

	if (error) {
		throw error;
	}

	return res;
};

export const updateSkillById = async (token: string, id: string, skill: object) => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/skills/id/${id}/update`, {
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			authorization: `Bearer ${token}`
		},
		body: JSON.stringify({
			...skill
		})
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.catch((err) => {
			error = err.detail;
			console.error(err);
			return null;
		});

	if (error) {
		throw error;
	}

	return res;
};

export const updateSkillAccessGrants = async (token: string, id: string, accessGrants: any[]) => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/skills/id/${id}/access/update`, {
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			authorization: `Bearer ${token}`
		},
		body: JSON.stringify({
			access_grants: accessGrants
		})
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.catch((err) => {
			error = err.detail;
			console.error(err);
			return null;
		});

	if (error) {
		throw error;
	}

	return res;
};

export const toggleSkillById = async (token: string, id: string) => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/skills/id/${id}/toggle`, {
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			authorization: `Bearer ${token}`
		}
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.then((json) => {
			return json;
		})
		.catch((err) => {
			error = err.detail;
			console.error(err);
			return null;
		});

	if (error) {
		throw error;
	}

	return res;
};

export const deleteSkillById = async (token: string, id: string) => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/skills/id/${id}/delete`, {
		method: 'DELETE',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			authorization: `Bearer ${token}`
		}
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.then((json) => {
			return json;
		})
		.catch((err) => {
			error = err.detail;
			console.error(err);
			return null;
		});

	if (error) {
		throw error;
	}

	return res;
};
