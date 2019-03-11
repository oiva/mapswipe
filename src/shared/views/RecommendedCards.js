// @flow
import * as React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { firebaseConnect, isLoaded, isEmpty } from 'react-redux-firebase';
import {
    ScrollView,
    StyleSheet,
    Text,
} from 'react-native';
import Button from 'apsl-react-native-button';
import Modal from 'react-native-modalbox';
import ProjectCard from './ProjectCard';
import LoadingIcon from './LoadingIcon';
import type { NavigationProp, ProjectType } from '../flow-types';

const GLOBAL = require('../Globals');

const style = StyleSheet.create({
    header: {
        fontWeight: '700',
        color: '#212121',
        fontSize: 18,
    },
    inModalButton2: {
        backgroundColor: '#ee0000',
        height: 50,
        padding: 12,
        borderRadius: 5,
        borderWidth: 0.1,
        width: 260,
        marginTop: 20,
    },
    inModalButton: {
        backgroundColor: '#0d1949',
        height: 50,
        padding: 12,
        borderRadius: 5,
        borderWidth: 0.1,
        width: 260,
    },
    listView: {
        width: GLOBAL.SCREEN_WIDTH,
        flex: 0,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    modal: {
        padding: 20,
    },
    modal3: {
        marginTop: 10,
        height: 300,
        width: 300,
        backgroundColor: '#ffffff',
        borderRadius: 2,
    },
    announcementButton: {
        width: GLOBAL.SCREEN_WIDTH,
        height: 40,
        marginTop: 10,
        borderColor: '#0d1949',
        borderRadius: 0,
        borderWidth: 2,
    },
    tutPar: {
        fontSize: 14,
        color: '#575757',
        fontWeight: '500',
        lineHeight: 20,
        marginTop: 10,
    },
});

type OrderedProject = {
    key: number,
    value: ProjectType,
};

type Props = {
    announcement: Object,
    navigation: NavigationProp,
    projects: Array<OrderedProject>,
};

class _RecommendedCards extends React.Component<Props> {
    openModal3 = () => {
        const parent = this;

        GLOBAL.DB.openPopup().then(() => {
            console.log('No need to open new tut window');
        }).catch(() => {
            if (parent.tutorialModal) {
                parent.tutorialModal.open();
            }
        });
    }

    closeModal3 = () => {
        if (this.tutorialModal) {
            this.tutorialModal.close();
        }
        GLOBAL.DB.stopPopup();
    }

    tutorialModal: ?Modal;

    renderAnnouncement = () => {
        const { announcement, navigation } = this.props;
        if (!isLoaded(announcement) || isEmpty(announcement)) {
            return null;
        }
        return (
            <Button
                onPress={() => {
                    navigation.push('WebviewWindow', {
                        uri: announcement.url,
                    });
                }}
                key="announce"
                style={style.announcementButton}
                textStyle={{
                    color: '#0d1949',
                    fontSize: 13,
                    fontWeight: '700',
                }}
            >
                {announcement.text}
            </Button>
        );
    }

    renderHelpModal = () => {
        const { navigation } = this.props;
        return (
            <Modal
                key="modal"
                style={[style.modal, style.modal3]}
                backdropType="blur"
                position="top"
                ref={(r) => { this.tutorialModal = r; }}
            >
                <Text style={style.header}>Tutorial</Text>
                <Text style={style.tutPar}>Learn more about how to use Mapswipe!</Text>
                <Button
                    style={style.inModalButton2}
                    onPress={() => {
                        this.closeModal3();
                        navigation.push('WebviewWindow', {
                            uri: GLOBAL.TUT_LINK,
                        });
                    }}
                    textStyle={{ fontSize: 13, color: '#ffffff', fontWeight: '700' }}
                >
                    Go To Tutorial
                </Button>
                <Button
                    style={style.inModalButton}
                    onPress={this.closeModal3}
                    textStyle={{ fontSize: 13, color: '#ffffff', fontWeight: '700' }}
                >
                    No thanks
                </Button>
            </Modal>
        );
    }

    render() {
        const {
            navigation,
            projects,
        } = this.props;
        if (!isLoaded(projects)) {
            return (<LoadingIcon key="icon" />);
        }
        if (isLoaded(projects) && isEmpty(projects)) {
            return (<Text>Nothing to work on!</Text>);
        }

        return (
            <ScrollView
                contentContainerStyle={style.listView}
                removeClippedSubviews
            >
                { this.renderAnnouncement() }
                { projects.sort((a, b) => +b.value.isFeatured - +a.value.isFeatured)
                    .map(project => (
                        <ProjectCard
                            navigation={navigation}
                            card={project.value}
                            key={project.key}
                            cardIndex={project.key}
                        />
                    ))
                }
                { this.renderHelpModal() }
            </ScrollView>
        );
    }
}

const mapStateToProps = (state, ownProps) => (
    {
        // define where the props (left of the colon) are coming from in the redux store (right)
        // the right side must match the definitions "path" under firebaseConnect below
        announcement: state.firebase.data.announcement,
        navigation: ownProps.navigation,
        projects: state.firebase.ordered.projects,
    }
);

export default compose(
    firebaseConnect(() => [
        // request only active projects from firebase (state === 0)
        // limit to 20 projects maximum
        // `path` defines where the resulting data is copied in the redux store
        // (state.firebase.ordered.projects in this case, because we've asked for `orderByChild`)
        { path: 'projects', queryParams: ['orderByChild=state', 'equalTo=0', 'limitToFirst=20'] },
        // load any announcement data from firebase
        // (state.firebase.data.announcement here because we've not ordered the query)
        { path: 'announcement', queryParams: ['limitToLast=2'] },
    ]),
    // connect to redux store
    connect(
        mapStateToProps,
    ),
)(_RecommendedCards);
