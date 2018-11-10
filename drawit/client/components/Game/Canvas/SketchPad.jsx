import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { setContextAction, setToolAction, addItemAction } from '../../../store/actions/game.actions';
import { DEFAULT_TOOL } from './defaults';
import tools from './tools';
import socket from '../../../sockets';
import { BorderStyles } from '../../../styles';

const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 500;

class SketchPad extends PureComponent {
  constructor(props) {
    super(props);

    this.onTouchMove = this.onTouchMove.bind(this);
    this.onTouchStart = this.onTouchStart.bind(this);
    this.onTouchEnd = this.onTouchEnd.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
  }

  componentDidMount() {
    const { options, dispatchContext, dispatchTool } = this.props;
    const context = this.canvas.getContext('2d');
    const tool = new DEFAULT_TOOL(context, options);

    dispatchContext(context);
    dispatchTool(tool);
  }

  componentWillReceiveProps({ items }) {
    const newItem = items.slice(-1)[0];

    if (newItem) {
      const context = this.canvas.getContext('2d');
      const Tool = tools[newItem.tool];
      const tool = new Tool(context, newItem.options);

      tool.drawItem(newItem);
    }
  }

  onMouseDown(event) {
    if (!this.props.disabled) {
      const { tool } = this.props;
      const position = this.getCursorPosition(event);
      tool.onMouseDown(position);
    }
  }

  onMouseMove(event) {
    if (!this.props.disabled) {
      const { tool } = this.props;
      const position = this.getCursorPosition(event);
      tool.onMouseMove(position);
    }
  }

  onMouseUp(event) {
    if (!this.props.disabled) {
      const { tool, joinCode, dispatchItem } = this.props;
      const position = this.getCursorPosition(event);
      const item = tool.onMouseUp(position);

      if (item) {
        socket.emit('round:draw', { item, joinCode });
        dispatchItem(item);
      }
    }
  }

  onTouchStart(event) {
    if (!this.props.disabled) {
      const { tool } = this.props;
      const position = this.getCursorPosition(event.changedTouches[0]);
      
      tool.onMouseDown(position);
    }
  }
  
  onTouchMove(event) {
    if (!this.props.disabled) {
      const { tool } = this.props;
      const position = this.getCursorPosition(event.touches[0]);

      tool.onMouseMove(position);
    }
  }

  onTouchEnd(event) {
    if (!this.props.disabled) {
      const { tool, joinCode, dispatchItem } = this.props;
      const position = this.getCursorPosition(event.changedTouches[0]);
      
      console.log(event.changedTouches[0], 'changed END');
      const item = tool.onMouseUp(position);
      
      if (item) {
        socket.emit('round:draw', { item, joinCode });
        dispatchItem(item);
      }
      dispatchItem(item);
    }
  }
  
  getCursorPosition({ clientX, clientY }) {
    const { top, left } = this.canvas.getBoundingClientRect();

    console.log(clientX, clientY, 'clientX, clientY');

    return {
      mouseX: clientX - left,
      mouseY: clientY - top,
    };
  }
 
  render() {
    return (
      <canvas
        ref={(canvas) => { this.canvas = canvas; }}
        className={BorderStyles}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onMouseDown={this.onMouseDown}
        onMouseMove={this.onMouseMove}
        onMouseOut={this.onMouseUp}
        onMouseUp={this.onMouseUp}
        onBlur={this.onMouseUp}
        onTouchStart={this.onTouchStart}
        onTouchMove={this.onTouchMove}
        onTouchEnd={this.onTouchEnd}
      />
    );
  }
}

SketchPad.defaultProps = {
  tool: null,
};

SketchPad.propTypes = {
  disabled: PropTypes.bool.isRequired,
  joinCode: PropTypes.string.isRequired,
  items: PropTypes.arrayOf(PropTypes.object).isRequired,
  tool: PropTypes.object,
  options: PropTypes.object.isRequired,
  dispatchContext: PropTypes.func.isRequired,
  dispatchTool: PropTypes.func.isRequired,
  dispatchItem: PropTypes.func.isRequired,
};

export default connect(
  ({ game }) => ({
    joinCode: game.joinCode,
    items: game.canvas.items,
    tool: game.canvas.tool,
    options: game.canvas.options,
  }),
  dispatch => ({
    dispatchContext: setContextAction(dispatch),
    dispatchTool: setToolAction(dispatch),
    dispatchItem: addItemAction(dispatch),
  }),
)(SketchPad);
