import {
  SchematicTestRunner,
  UnitTestTree
} from '@angular-devkit/schematics/testing';
import { Tree } from '@angular-devkit/schematics';
import * as path from 'path';
import { TsconfigPatchOptions } from './models/tsconfig-patch-options';

const collectionPath = path.join(__dirname, '../collection.json');

describe('@co-it/schematics:jest', () => {
  let runner: SchematicTestRunner;
  let actualTree: Tree;

  beforeEach(() => {
    runner = new SchematicTestRunner('jest', collectionPath);
    actualTree = new UnitTestTree(Tree.empty());

    const packageBeforeInstall = {
      scripts: {},
      devDependencies: {
        karma: 'latest',
        'karma-chrome-launcher': 'latest',
        'karma-coverage-istanbul-reporter': 'latest',
        'karma-jasmine': 'latest',
        'karma-jasmine-html-reporter': 'latest'
      }
    };
    const specsTsConfigBeforeInstall = {
      compilerOptions: {
        types: ['jasmine', 'node']
      },
      files: ['test.ts']
    };
    actualTree.create('package.json', JSON.stringify(packageBeforeInstall));
    actualTree.create(
      'src/tsconfig.spec.json',
      JSON.stringify(specsTsConfigBeforeInstall)
    );
  });

  describe('when jest is not installed', () => {
    it.each([['jest'], ['jest-preset-angular']])(
      'should add %p to devDependencies',
      (packageId: string) => {
        const tree = runner.runSchematic('jest', {}, actualTree);

        const packageJson = JSON.parse(tree.readContent('package.json'));

        expect(packageJson.devDependencies).toEqual(
          expect.objectContaining({ [packageId]: expect.anything() })
        );
      }
    );

    it('should add a jest configuration file', () => {
      const tree = runner.runSchematic('jest', {}, actualTree);
      expect(tree.exists('jest.config.js'));
    });

    it('should add a jest setup file', () => {
      const tree = runner.runSchematic('jest', {}, actualTree);

      expect(tree.exists('src/setup-jest.ts'));
    });
    it.each([
      ['karma'],
      ['karma-chrome-launcher'],
      ['karma-coverage-istanbul-reporter'],
      ['karma-jasmine'],
      ['karma-jasmine-html-reporter']
    ])(
      'should remove all karma related Packages from dev-dependencies',
      (packageId: string) => {
        const tree = runner.runSchematic('jest', {}, actualTree);
        const packageJson = JSON.parse(tree.readContent('package.json'));

        expect(packageJson.devDependencies[packageId]).toBeUndefined();
      }
    );

    it('should remove the karma configuration', () => {
      actualTree.create('src/karma.conf.js', '');

      const tree = runner.runSchematic('jest', {}, actualTree);
      expect(tree.exists('src/karma.conf.js')).toBe(false);
    });

    it('should remove the karma setup file', () => {
      actualTree.create('src/test.ts', '');

      const tree = runner.runSchematic('jest', {}, actualTree);
      expect(tree.exists('src/test.ts')).toBe(false);
    });

    it('should remove the karma setup file from the test-tsConfig', () => {
      const tree = runner.runSchematic('jest', {}, actualTree);
      const tsConfig = JSON.parse(tree.readContent('src/tsconfig.spec.json'));

      expect(tsConfig.files.includes('test.ts')).toBe(false);
    });

    it('should remove jasmine types from test-compiler options', () => {
      const tree = runner.runSchematic('jest', {}, actualTree);
      const tsConfig = JSON.parse(tree.readContent('src/tsconfig.spec.json'));

      expect(tsConfig.compilerOptions.types.includes('jasmine')).toBe(false);
    });

    it('should add jest types to test-compiler options', () => {
      const tree = runner.runSchematic('jest', {}, actualTree);
      const tsConfig = JSON.parse(tree.readContent('src/tsconfig.spec.json'));

      expect(tsConfig.compilerOptions.types.includes('jest')).toBe(true);
    });

    it('should set module to commonjs in test-compiler options', () => {
      const tree = runner.runSchematic('jest', {}, actualTree);
      const tsConfig = JSON.parse(tree.readContent('src/tsconfig.spec.json'));

      expect(tsConfig.compilerOptions.module).toBe('commonjs');
    });
  });

  describe('when package.json does not contain jest scripts', () => {
    it('should add a jest watch script', () => {
      const tree = runner.runSchematic('jest', {}, actualTree);
      const packageAfterInstall = JSON.parse(tree.readContent('package.json'));
      expect(packageAfterInstall.scripts['test:watch']).toBe('jest --watch');
    });

    it('should set the test script to jest', () => {
      const tree = runner.runSchematic('jest', {}, actualTree);
      const packageAfterInstall = JSON.parse(tree.readContent('package.json'));
      expect(packageAfterInstall.scripts['test']).toBe('jest');
    });

    it.todo('should add a husky git hook before push');
  });
});
