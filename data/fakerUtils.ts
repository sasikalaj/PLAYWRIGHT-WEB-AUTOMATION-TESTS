import { faker } from '@faker-js/faker';

export const buildRegistrationDetails = () => ({
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  dob: faker.date.birthdate({ min: 18, max: 65, mode: 'age' }).toISOString().split('T')[0],
  address: faker.location.streetAddress(),
  houseNumber: faker.number.int({ min: 1, max: 9999 }).toString(),
  city: faker.location.city(),
  state: faker.location.state(),
  country: 'Australia',
  postcode: faker.location.zipCode('#####'),
  phone: faker.phone.number({ style: 'national' }).replace(/\D/g, '').slice(0, 10),
  email: faker.internet.email(),
  password: faker.internet.password({ length: 12, memorable: false, pattern: /\w/, prefix: 'A1!' }),
});
