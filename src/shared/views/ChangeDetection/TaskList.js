// @flow
import * as React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { firebaseConnect } from 'react-redux-firebase';
import { FlatList } from 'react-native';
import LoadingIcon from '../LoadingIcon';
import LoadMoreCard from '../LoadMore';
// import TutorialBox from '../../common/Tutorial';
import ChangeDetectionTask from './Task';
import { toggleMapTile } from '../../actions/index';

import type {
    CategoriesType,
    ChangeDetectionGroupType,
    NavigationProp,
    ResultType,
} from '../../flow-types';

const GLOBAL = require('../../Globals');

type Props = {
    categories: CategoriesType,
    group: ChangeDetectionGroupType,
    navigation: NavigationProp,
    onToggleTile: (ResultType) => void,
    submitResult: (number, string) => void,
    tutorial: boolean,
    updateProgress: (number) => void,
};

type State = {
    groupCompleted: boolean,
};

class _ChangeDetectionTaskList extends React.Component<Props, State> {
    onScroll = (event: Object) => {
        // this event is triggered much more than once during scrolling
        // Updating the progress bar here allows a smooth transition
        const { updateProgress } = this.props;
        const {
            contentOffset: { x },
            contentSize: { width },
        } = event.nativeEvent;
        const progress = width === 0 ? 0 : x / width;
        updateProgress(progress);
        return progress;
    };

    toNextGroup = () => {
        const { navigation } = this.props;
        navigation.navigate('ChangeDetectionScreen');
    };

    render = () => {
        const {
            categories,
            group,
            navigation,
            onToggleTile,
            submitResult,
            tutorial,
        } = this.props;
        if (!group || !group.tasks) {
            return <LoadingIcon />;
        }

        return (
            <FlatList
                style={{
                    height: '100%',
                    width: GLOBAL.SCREEN_WIDTH,
                }}
                data={group.tasks}
                disableIntervalMomentum
                keyExtractor={(task) => task.taskId}
                horizontal
                initialNumToRender={1}
                ListFooterComponent={
                    <LoadMoreCard
                        group={group}
                        navigation={navigation}
                        toNextGroup={this.toNextGroup}
                        projectId={group.projectId}
                        tutorial={tutorial}
                    />
                }
                onScroll={this.onScroll}
                pagingEnabled
                renderItem={({ item, index }) => (
                    <ChangeDetectionTask
                        categories={categories}
                        index={index}
                        onToggleTile={onToggleTile}
                        submitResult={submitResult}
                        task={item}
                        tutorial={false}
                    />
                )}
                snapToInterval={GLOBAL.SCREEN_WIDTH * 0.8}
                showsHorizontalScrollIndicator={false}
            />
        );
    };
}

const mapStateToProps = (state, ownProps) => ({
    commitCompletedGroup: ownProps.commitCompletedGroup,
    group: ownProps.group,
    submitResult: ownProps.submitResult,
});

const mapDispatchToProps = (dispatch) => ({
    onToggleTile: (tileInfo) => {
        dispatch(toggleMapTile(tileInfo));
    },
});

export default compose(
    firebaseConnect((props) => {
        // wait for the group data to be available in redux-firebase
        if (props.group) {
            const { groupId, projectId } = props.group;
            const prefix = props.tutorial ? 'tutorial' : 'projects';
            if (groupId !== undefined) {
                const r = props.results;
                // also wait for the startTime timestamp to be set (by START_GROUP)
                // if we don't wait, when opening a project for the second time
                // group is already set from before, so the tasks listener is often
                // set before the groups one, which results in tasks being received
                // before the group. The groups then remove the tasks list from
                // redux, and we end up not being able to show anything.
                // This is a bit hackish, and may not work in all situations, like
                // on slow networks.
                if (
                    r[projectId] &&
                    r[projectId][groupId] &&
                    r[projectId][groupId].startTime
                ) {
                    return [
                        {
                            type: 'once',
                            path: `v2/tasks/${projectId}/${groupId}`,
                            storeAs: `${prefix}/${projectId}/groups/${groupId}/tasks`,
                        },
                    ];
                }
            }
        }
        return [];
    }),
    connect(mapStateToProps, mapDispatchToProps),
)(_ChangeDetectionTaskList);
