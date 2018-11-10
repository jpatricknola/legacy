import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import ReactRouterPropTypes from 'react-router-prop-types';
import NotificationSystem from 'react-notification-system';
import styled from 'react-emotion';

import Flex from '../components/Utils/Flex';
import NicknameForm from '../components/Game/NicknameForm';
import CountDown from '../components/Game/CountDown';
import TopBar from '../components/Game/TopBar';
import ScoreBoard from '../components/Game/ScoreBoard';
import Canvas from '../components/Game/Canvas/Canvas';
import ChatBox from '../components/Game/Chat/Box';

import socket from '../sockets';
import { setJoinCodeAction, startAction } from '../store/actions/game.actions';

const Container = styled('div')`
  padding: 20px;
`;

const Game = styled(Flex)`
  width: 100%;
  position: relative;
`;

class ScreenGame extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      word: null,
      scores: [],
      joined: false,
      drawing: false,
      endedWord: null,
      roundEnded: false,
      gameEnded: false,
      showScoreBoard: false,
      artwork: null, // added
    };

    this.onGameJoined = this.onGameJoined.bind(this);
    this.onGameEnd = this.onGameEnd.bind(this);
    this.onRoundStarted = this.onRoundStarted.bind(this);
    this.onRoundChosen = this.onRoundChosen.bind(this);
    this.onRoundCorrectGuess = this.onRoundCorrectGuess.bind(this);
    this.onRoundEnd = this.onRoundEnd.bind(this);
    this.addNotification = this.addNotification.bind(this);
    this.toggleScoreBoard = this.toggleScoreBoard.bind(this);
    this.saveImg = this.saveImg.bind(this); // added
    this.updateArt = this.updateArt.bind(this); // added
    this.twitterCall = this.twitterCall.bind(this); // added
  }

  componentDidMount() {
    const { match, dispatchJoinCode } = this.props;
    const { joinCode } = match.params;

    dispatchJoinCode(joinCode);

    socket.on('game:joined', this.onGameJoined);
    socket.on('game:end', this.onGameEnd);
    socket.on('round:started', this.onRoundStarted);
    socket.on('round:chosen', this.onRoundChosen);
    socket.on('round:correct_guess', this.onRoundCorrectGuess);
    socket.on('round:end', this.onRoundEnd);
  }

  componentWillUnmount() {
    socket.off('game:joined', this.onGameJoined);
    socket.off('game:end', this.onGameEnd);
    socket.off('round:started', this.onRoundStarted);
    socket.off('round:chosen', this.onRoundChosen);
    socket.off('round:correct_guess', this.onRoundCorrectGuess);
    socket.off('round:end', this.onRoundEnd);
  }

  onGameJoined({ game, nickname }) {
    this.setState({
      scores: game.players,
      joined: this.state.joined || nickname === this.props.nickname,
    });
  }

  onGameEnd({ word, scores }) {
    this.setState({
      scores,
      drawing: false,
      guessedCorrectly: false,
      gameEnded: true,
      showScoreBoard: true,
      endedWord: word,
    });
  }

  onRoundStarted() {
    this.props.dispatchStart();
    this.setState({
      roundEnded: false,
      endedWord: null,
      showScoreBoard: false,
    });
  }

  onRoundChosen({ word }) {
    this.setState({
      word,
      drawing: true,
      showScoreBoard: false,
    });
  }

  onRoundCorrectGuess({ nickname, scores }) {
    const { guessedCorrectly } = this.state;

    this.setState({
      scores,
      guessedCorrectly: guessedCorrectly || nickname === this.props.nickname,
    });
  }

  onRoundEnd({ word, scores }) {
    this.setState({
      scores,
      drawing: false,
      guessedCorrectly: false,
      roundEnded: true,
      showScoreBoard: true,
      endedWord: word,
    });
  }

  toggleScoreBoard() {
    this.setState({ showScoreBoard: !this.state.showScoreBoard });
  }

  // added
  updateArt(art) {
    this.setState({ artwork: art });
  }
  // added;
  saveImg() {
    const image = this.state.artwork;
    const head = 'data:image/png;base64,';
    if (image !== null) {
      const imgFileSize = Math.round((image.length - head.length) * 0.75);
      console.log(imgFileSize);
    }
    return image;
  }

  addNotification(notification) {
    this.notificationSystem.addNotification(notification);
  }
  // added
  twitterCall() {
    const randomString = (length) => {
      let text = '';
      const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
      }
      return text;
    };
    console.log(randomString(42));
    const pngImage = this.state.artwork.slice(22);
    // console.log(this.state.artwork);
    // media/upload
    // fetch('https://upload.twitter.com/1.1/media/upload.json', {
    //   method: 'POST',
    //   headers: {
    //     Accept: 'application/json',
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     media_data: pngImage,
    //   }),
    // });
  }

  render() {
    const {
      match,
      nickname,
      isAdmin,
      started,
    } = this.props;
    const {
      word,
      scores,
      joined,
      drawing,
      guessedCorrectly,
      endedWord,
      roundEnded,
      gameEnded,
      showScoreBoard,
    } = this.state;
    const { joinCode } = match.params;
    const ended = roundEnded || gameEnded;
    const displayWord = (drawing && word) || (ended && endedWord);
    const canGuess = !drawing && !guessedCorrectly;

    return (
      <div>
        {
          !joined
          ? <NicknameForm joinCode={joinCode} addNotification={this.addNotification} />
          : (
            <Container>
              {started && !roundEnded ? <CountDown date={new Date(89000)} /> : null}
              {started && roundEnded ? <CountDown date={new Date(14000)} /> : null}
              <TopBar
                isAdmin={isAdmin}
                started={started}
                drawing={drawing}
                word={displayWord}
                joinCode={joinCode}
                showingScoreBoard={showScoreBoard}
                addNotification={this.addNotification}
                toggleScoreBoard={this.toggleScoreBoard}
                saveImg={this.saveImg} // added
                twitterCall={this.twitterCall} // added
              />
              <Game>
                {
                  showScoreBoard
                  ? (
                    <ScoreBoard
                      scores={scores}
                      roundEnded={roundEnded}
                      gameEnded={gameEnded}
                    />
                  )
                  : null
                }
                <Canvas
                  drawing={drawing}
                  updateArt={this.updateArt}
                />
                <ChatBox
                  canGuess={canGuess}
                  nickname={nickname}
                  joinCode={joinCode}
                  addNotification={this.addNotification}
                />
              </Game>
            </Container>
          )
        }
        <NotificationSystem
          ref={(notificationSystem) => { this.notificationSystem = notificationSystem; }}
        />
      </div>
    );
  }
}

ScreenGame.propTypes = {
  match: ReactRouterPropTypes.match.isRequired,
  nickname: PropTypes.string.isRequired,
  isAdmin: PropTypes.bool.isRequired,
  started: PropTypes.bool.isRequired,
  dispatchJoinCode: PropTypes.func.isRequired,
  dispatchStart: PropTypes.func.isRequired,
};

export default connect(
  ({ game }) => ({
    nickname: game.nickname,
    isAdmin: game.isAdmin,
    started: game.started,
  }),
  dispatch => ({
    dispatchJoinCode: setJoinCodeAction(dispatch),
    dispatchStart: startAction(dispatch),
  }),
)(ScreenGame);

