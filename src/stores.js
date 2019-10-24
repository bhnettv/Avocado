import { writable } from 'svelte/store';

export const search = writable( '' );
export const add_disabled = writable( false );
export const developer_list = writable( [] );
export const developer_index = writable( -1 );
export const label_list = writable( [] );
export const label_index = writable( -1 );
export const tab_index = writable( 0 );
export const social_disabled = writable( true );
export const notes_disabled = writable( true );
export const overview_disabled = writable( true );
export const social_index = writable( 0 );
export const developer_id = writable( '' );
export const developer_name = writable( '' );
export const developer_email = writable( '' );
export const developer_image = writable( '' );
export const developer_labels = writable( [] );
export const developer_skills = writable( [] );
export const developer_description = writable( '' );
export const controls_mode = writable( 0 );