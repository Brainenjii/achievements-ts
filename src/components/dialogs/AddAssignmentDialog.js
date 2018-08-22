/**
 * @file AddAssignmentDialog container module
 * @author Theodor Shaytanov <theodor.shaytanov@gmail.com>
 * @created 28.01.18
 */

import { APP_SETTING } from "../../achievementsApp/config";

import Button from "@material-ui/core/Button";
import Checkbox from "@material-ui/core/Checkbox";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import FormControl from "@material-ui/core/FormControl";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Input from "@material-ui/core/Input";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import PropTypes from "prop-types";
import React, { Fragment } from "react";
import Select from "@material-ui/core/Select";
import TextField from "@material-ui/core/TextField";
import { ASSIGNMENTS_TYPES } from "../../services/courses";
import {
  assignmentAddRequest,
  assignmentCloseDialog,
  assignmentManualUpdateField,
  updateNewAssignmentField
} from "../../containers/Assignments/actions";
import { courseInfo, entityInfo } from "../../types/index";

class AddAssignmentDialog extends React.PureComponent {
  static propTypes = {
    uid: PropTypes.any,
    course: courseInfo,
    assignment: PropTypes.any,
    dispatch: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
    paths: PropTypes.arrayOf(entityInfo).isRequired,
    activities: PropTypes.arrayOf(entityInfo).isRequired
  };

  manualChangeField = field => e =>
    this.props.dispatch(assignmentManualUpdateField(field, e.target.value));
  updateField = field => e =>
    this.props.dispatch(updateNewAssignmentField(field, e.target.value));
  onClose = () => this.props.dispatch(assignmentCloseDialog());
  onCommit = () => {
    const { course, dispatch, assignment } = this.props;

    dispatch(assignmentAddRequest(course.id, assignment));
  };

  getAssignmentSpecificFields(assignment) {
    let { activities, paths, uid } = this.props;

    switch (assignment.questionType) {
      case ASSIGNMENTS_TYPES.CodeCombat.id:
        return (
          <FormControl fullWidth margin="normal">
            <InputLabel htmlFor="select-multiple-levels">Level</InputLabel>
            <Select
              input={<Input id="select-multiple-levels" />}
              margin="none"
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 224,
                    width: 250
                  }
                }
              }}
              onChange={this.updateField("level")}
              value={assignment.level || ""}
            >
              {Object.keys(APP_SETTING.levels).map(id => (
                <MenuItem key={APP_SETTING.levels[id].name} value={id}>
                  {APP_SETTING.levels[id].name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      case ASSIGNMENTS_TYPES.CodeCombat_Number.id:
        return (
          <TextField
            fullWidth
            label="Levels amount"
            margin="normal"
            onChange={this.updateField("count")}
            type="number"
            value={assignment.count}
          />
        );
      case ASSIGNMENTS_TYPES.PathActivity.id:
        return (
          <Fragment>
            <TextField
              fullWidth
              label="Path"
              onChange={this.updateField("path")}
              select
              value={assignment.path || uid}
            >
              <MenuItem value={uid}>Default</MenuItem>
              {paths.map(path => (
                <MenuItem key={path.id} value={path.id}>
                  {path.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              label="Activity"
              onChange={this.updateField("problem")}
              select
              value={assignment.problem || ""}
            >
              {activities.map(activity => (
                <MenuItem key={activity.id} value={activity.id}>
                  {activity.name}
                </MenuItem>
              ))}
            </TextField>
            <FormControlLabel
              control={
                <Checkbox
                  checked={assignment.allowSolutionImport || false}
                  onChange={e =>
                    this.updateField("allowSolutionImport")({
                      target: {
                        value: e.target.checked
                      }
                    })
                  }
                  value="allowSolutionImport"
                />
              }
              label="Allow import existing path solution"
            />
          </Fragment>
        );
      case ASSIGNMENTS_TYPES.PathProgress.id:
        return (
          <TextField
            fullWidth
            label="Path"
            onChange={this.updateField("path")}
            select
            value={assignment.path || "default"}
          >
            <MenuItem value="default">Default</MenuItem>
            {paths.map(path => (
              <MenuItem key={path.id} value={path.id}>
                {path.name}
              </MenuItem>
            ))}
          </TextField>
        );
      default:
    }
  }

  render() {
    let { assignment, course, open } = this.props;
    const teamFormations = course.assignments.filter(
      assignment =>
        assignment.questionType === ASSIGNMENTS_TYPES.TeamFormation.id
    );

    assignment = assignment || {};

    return (
      <Dialog onClose={this.onClose} open={open}>
        <DialogTitle>
          {assignment.id ? "Edit Assignment" : "New Assignment"}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Type of question"
            margin="normal"
            onChange={this.updateField("questionType")}
            select
            value={assignment.questionType || ""}
          >
            {Object.keys(ASSIGNMENTS_TYPES).map(key => (
              <MenuItem key={key} value={key}>
                {ASSIGNMENTS_TYPES[key].caption}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            label="Name"
            margin="normal"
            onChange={this.updateField("name")}
            onKeyPress={this.manualChangeField("name")}
            value={assignment.name || ""}
          />
          <TextField
            fullWidth
            label="Details/Links"
            margin="normal"
            onChange={this.updateField("details")}
            onKeyPress={this.manualChangeField("details")}
            value={assignment.details || ""}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={assignment.useTeams || false}
                onChange={e =>
                  this.updateField("useTeams")({
                    target: {
                      value: e.target.checked
                    }
                  })
                }
                value="useTeams"
              />
            }
            disabled={!teamFormations.length}
            label="Use team formation"
          />
          <TextField
            disabled={!(teamFormations.length && assignment.useTeams)}
            fullWidth
            label="Team Formation Assignment"
            onChange={this.updateField("teamFormation")}
            select
            value={assignment.teamFormation || ""}
          >
            {teamFormations.map(assignment => (
              <MenuItem key={assignment.id} value={assignment.id}>
                {assignment.name}
              </MenuItem>
            ))}
          </TextField>
          {this.getAssignmentSpecificFields(assignment)}
          <TextField
            fullWidth
            InputLabelProps={{
              shrink: true
            }}
            label="Open"
            margin="normal"
            onChange={this.updateField("open")}
            type="datetime-local"
            value={assignment.open || ""}
          />
          <TextField
            fullWidth
            InputLabelProps={{
              shrink: true
            }}
            label="Deadline"
            margin="normal"
            onChange={this.updateField("deadline")}
            type="datetime-local"
            value={assignment.deadline || ""}
          />
        </DialogContent>
        <DialogActions>
          <Button color="secondary" onClick={this.onClose}>
            Cancel
          </Button>
          <Button color="primary" onClick={this.onCommit} variant="raised">
            Commit
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
}

export default AddAssignmentDialog;
