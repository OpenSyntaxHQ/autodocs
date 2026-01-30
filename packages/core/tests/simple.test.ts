import path from 'path';
import { createProgram } from '../src/parser';
import { extractDocs } from '../src/extractor';

describe('Core Parser', () => {
    it('should extract interfaces', () => {
        const fixturePath = path.join(__dirname, 'fixtures/simple.ts');
        const program = createProgram([fixturePath]);
        const docs = extractDocs(program);
        
        expect(docs).toHaveLength(1);
        expect(docs[0].name).toBe('User');
        expect(docs[0].kind).toBe('interface');
        expect(docs[0].members).toHaveLength(2);
        
        const members = docs[0].members!;
        expect(members.find(m => m.name === 'id')).toBeDefined();
        expect(members.find(m => m.name === 'name')).toBeDefined();
    });
});
