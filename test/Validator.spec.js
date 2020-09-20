import { expect } from 'chai';
import Validator from '../src/Validator';

describe('Validator', () => {
  describe('firstErrorMessage', () => {
    it('should respond properly to the `on` option', () => {
      const validators = {
        format: [
          { with: /\d{3}/, message: 'Must have three digits', on: 'BLUR' },
          { with: /dog/, message: 'Must include a dog', on: 'VALIDATE' },
          { with: /[a-z]{4}/, message: 'Must have four letters', on: ['BLUR', 'VALIDATE'] },
        ],
        length: [{ maximum: 7, messages: { maximum: 'Must be no more than 7 characters' } }],
      };
      expect(Validator.firstErrorMessage(validators, 'changeme', 'CHANGE')).to.equal(
        'Must be no more than 7 characters'
      );
      expect(Validator.firstErrorMessage(validators, 'change', 'CHANGE')).to.equal(null);
      expect(Validator.firstErrorMessage(validators, 'change', 'BLUR')).to.equal('Must have three digits');
      expect(Validator.firstErrorMessage(validators, 'cha333', 'BLUR')).to.equal('Must have four letters');
      expect(Validator.firstErrorMessage(validators, 'chang333', 'BLUR')).to.equal('Must be no more than 7 characters');
      expect(Validator.firstErrorMessage(validators, 'chan333', 'BLUR')).to.equal(null);
      expect(Validator.firstErrorMessage(validators, 'chan333', 'VALIDATE')).to.equal('Must include a dog');
      expect(Validator.firstErrorMessage(validators, 'dog333', 'VALIDATE')).to.equal('Must have four letters');
      expect(Validator.firstErrorMessage(validators, 'dogsaregreat', 'VALIDATE')).to.equal(
        'Must be no more than 7 characters'
      );
      expect(Validator.firstErrorMessage(validators, 'dogsare', 'VALIDATE')).to.equal(null);
    });
  });
});
