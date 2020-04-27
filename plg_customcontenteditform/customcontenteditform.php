<?php
defined('_JEXEC') or die;

use Joomla\CMS\Factory;
use Joomla\CMS\Form\Form;
use Joomla\CMS\Uri\Uri;

class PlgSystemCustomcontenteditform extends JPlugin {
  /**
   * The app
   *
   * @var  Joomla/CMS/Application
   */
  protected $app;

  /**
   * The magic happens here!! ;)
   *
   * @param  $form
   * @param  $data
   *
   * @return bool
   */
  public function onContentPrepareForm($form, $data) {
    // Check we are manipulating a valid form.
    if (!($form instanceof Form)) {
      return true;
    }

    // Check that we are manipulating a valid form.
    $name = $form->getName();

    if (!in_array($name, array('com_content.article'))) {
      return true;
    }

    $input = Factory::getApplication()->input;
    $oldArray = $input->getArray();
    $oldLayout = $input->get('layout', '');
    $root = $this->app->isClient('administrator') ? JPATH_ADMINISTRATOR : JPATH_ROOT;
    $file = $root . '/templates/' . $this->app->getTemplate() . '/html/' . $oldArray['option'] . '/' . $oldArray['view'] . '/edit_' . $data->catid . '.php';

    // Do the override only if a file really exists!!!
    if (is_file($file)) {
      if (!preg_match('#edit_#', $oldLayout)) {
        $newpath  = Uri::base() . 'index.php?';

        foreach ($oldArray as $key => $value) {
          if ($key !== 'layout') {
            $newpath .= $key . '=' . $value .'&';
          }
        }

        // Use the override!!
        $newpath .= 'layout=edit_' . $data->catid;
        Factory::getApplication()->redirect($newpath);
      }
    }

    return true;
  }
}
