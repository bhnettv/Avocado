import { writable } from 'svelte/store';

// Left column
export const search_term = writable( '' );
export const add_disabled = writable( false );
export const developer_list = writable( [] );
export const filtered_list = writable( [] );
export const organization_list = writable( [] );

// Tabs disabled
export const summary_tab = writable( false );
export const profile_tab = writable( true );
export const social_tab = writable( true );
export const notes_tab = writable( true );

// Tabs selected
export const summary_selected = writable( true );
export const profile_selected = writable( false );
export const social_selected = writable( false );
export const notes_selected = writable( false );

// Panels hidden
export const summary_hidden = writable( false );
export const profile_hidden = writable( true );
export const endpoints_hidden = writable( true );
export const timeline_hidden = writable( true );
export const notes_hidden = writable( true );

// Panels disabled
export const summary_disabled = writable( true );
export const profile_disabled = writable( true );
export const endpoints_disabled = writable( true );

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
export const endpoint_website = writable( '' );
export const endpoint_rss = writable( '' );
export const endpoint_devto = writable( '' );
export const endpoint_medium = writable( '' );
export const endpoint_youtube = writable( '' );
export const endpoint_twitter = writable( '' );
export const endpoint_so = writable( '' );
export const endpoint_github = writable( '' );
export const endpoint_reddit = writable( '' );
export const endpoint_instagram = writable( '' );

// Notes
export const notes_list = writable( [] );

// Controls
export const controls_mode = writable( 0 );
