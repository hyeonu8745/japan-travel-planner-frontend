import test from 'node:test';
import assert from 'node:assert/strict';
import { preferenceFoods } from '../src/utils/preferenceArtwork.js';

test('one server sentence can display every preferred food in its original order', () => {
  assert.deepEqual(preferenceFoods('장어덮밥, 볶음면, 오코노미야끼, 스시를 선호함'), [
    { key: 'unadon', label: '장어덮밥' }, { key: 'yakisoba', label: '볶음면' },
    { key: 'okonomiyaki', label: '오코노미야키' }, { key: 'sushi', label: '스시' },
  ]);
});
test('food aliases do not match arbitrary substrings or duplicate the same dish', () => {
  assert.deepEqual(preferenceFoods('회사를 방문하고 카레빵을 먹어요'), []);
  assert.deepEqual(preferenceFoods('스시와 초밥을 좋아해요'), [{ key: 'sushi', label: '스시' }]);
  assert.deepEqual(preferenceFoods(null), []);
});
