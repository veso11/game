export const FIRST_NAMES = [
  'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Jamie', 'Avery',
  'Quinn', 'Skyler', 'Drew', 'Rowan', 'Sasha', 'Devon', 'Emerson', 'Blair',
  'Elliot', 'Reese', 'Kai', 'Finley', 'Marina', 'Ivo', 'Nadia', 'Boris',
];

export const LAST_NAMES = [
  'Rivera', 'Kim', 'Novak', 'Petrov', 'Schmidt', 'Johnson', 'Nguyen',
  'Rossi', 'Dubois', 'Andersen', 'Costa', 'Fischer', 'Kowalski', 'Haddad',
  'Popov', 'Ivanov', 'Georgiev', 'Petrova',
];

export const COUNTRIES = [
  'United States', 'United Kingdom', 'Bulgaria', 'Germany', 'Canada',
  'Australia', 'Brazil', 'Japan', 'France', 'Spain', 'Italy', 'Poland',
];

export function randomName(): string {
  const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  return `${first} ${last}`;
}

export function randomCountry(): string {
  return COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
}
