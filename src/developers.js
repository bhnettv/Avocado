import { writable } from 'svelte/store';

export const organizations = writable( [] );
export const roles = writable( [] );
export const languages = writable( [] );
export const skills = writable( [] );

// Summary
export const developer_id = writable( null );
export const developer_name = writable( '' );
export const developer_email = writable( '' );
export const developer_image = writable( '' );
export const developer_organizations = writable( [] );
export const developer_location = writable( '' );
export const developer_latitude = writable( null );
export const developer_longitude = writable( null );

// Profile
export const developer_roles = writable( [] );
export const developer_languages = writable( [] );
export const developer_skills = writable( [] );
export const developer_public = writable( false );
export const developer_description = writable( '' );

// Social
export const social = writable( [] );

// Notes
export const notes = writable( [] );
