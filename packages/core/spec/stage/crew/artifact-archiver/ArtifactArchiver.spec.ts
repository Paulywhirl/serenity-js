import 'mocha';
import * as sinon from 'sinon';

import { ArtifactGenerated, AsyncOperationAttempted, DomainEvent, Name } from '../../../../src/domain';
import { Artifact, FileSystem, FileType, Path } from '../../../../src/io';
import { ArtifactArchiver, StageManager } from '../../../../src/stage';
import { given } from '../given';

import { expect } from '../../../expect';
import { photo } from '../samples';

describe('ArtifactArchiver', () => {

    let stageManager:   sinon.SinonStubbedInstance<StageManager>,
        fs:             sinon.SinonStubbedInstance<FileSystem>,
        archiver:       ArtifactArchiver;

    beforeEach(() => {
        fs           = sinon.createStubInstance(FileSystem);
        stageManager = sinon.createStubInstance(StageManager);

        archiver     = new ArtifactArchiver(fs as any);
        archiver.assignTo(stageManager as any);

        fs.store.returns(Promise.resolve(new Path('/some/absolute/path/to/the/artifact')));
    });

    describe('stores the artifacts generated by the other stage crew members', () => {

        const
            artifactName  = new Name('expected-file-name'),
            json = { key: 'value' },
            expectedJsonFilename = [ artifactName.value, FileType.JSON.extesion.value ].join('.'),
            expectedPngFilename  = [ artifactName.value, FileType.PNG.extesion.value ].join('.');

        it('publishes an event which promise will be resolved when the file is correctly stored on the file system', () => {
            given(archiver).isNotifiedOfFollowingEvents(
                new ArtifactGenerated(new Artifact(artifactName, FileType.JSON, json)),
            );

            expect(stageManager.notifyOf.callCount).to.equal(1);

            const asyncOperationAttempted = stageManager.notifyOf.firstCall.lastArg;

            expect(asyncOperationAttempted).to.be.instanceOf(AsyncOperationAttempted);
            expect(asyncOperationAttempted.crewMember).to.equal(ArtifactArchiver);
            expect(asyncOperationAttempted.taskDescription).to.equal(`save '${ expectedJsonFilename }'`);

            return expect(asyncOperationAttempted.value).to.be.fulfilled;
        });

        it('correctly saves JSON content to a file', () => {
            given(archiver).isNotifiedOfFollowingEvents(
                new ArtifactGenerated(new Artifact(artifactName, FileType.JSON, json)),
            );

            const asyncOperationAttempted = stageManager.notifyOf.firstCall.lastArg;

            return expect(asyncOperationAttempted.value).to.be.fulfilled.then(_ => {
                expect(fs.store).to.have.been.calledWith(new Path(expectedJsonFilename), JSON.stringify(json));
            });
        });

        it('correctly saves PNG content to a file', () => {
            given(archiver).isNotifiedOfFollowingEvents(
                new ArtifactGenerated(new Artifact(artifactName, FileType.PNG, photo.value)),
            );

            const asyncOperationAttempted = stageManager.notifyOf.firstCall.lastArg;

            return expect(asyncOperationAttempted.value).to.be.fulfilled.then(_ => {
                expect(fs.store).to.have.been.calledWith(new Path(expectedPngFilename), photo.value, 'base64');
            });
        });
    });

    describe(`when it encounters events it's not interested in`, () => {

        class SomeEvent extends DomainEvent {
            constructor() {
                super();
            }
        }

        const someEvent = new SomeEvent();

        it(`ignores them`, () => {
            given(archiver).isNotifiedOfFollowingEvents(
                someEvent,
            );

            expect(stageManager.notifyOf).to.not.have.been.of;            // tslint:ignore-line:no-unused-expression
            expect(fs.store).to.not.have.been.of;                         // tslint:ignore-line:no-unused-expression
        });
    });
});
